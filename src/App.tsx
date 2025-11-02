// function App() {
  

//   return (
//     <><p>
//       1.The web page would show call analytics charts for voice agents. Use imaginary data
//           to represent these charts.
//      2.Allow users to overwrite dummy values (for at least one chart) with their custom values
// and the chart should reflect that change.
//  3.But before allowing user to do this, ask them for their email and save these custom
// values in Supabase against their email
// 4. Next time if they set new values, show them their previous values and ask if it’s OK to
// overwrite it
// </p>

//     </>
//   )
// }
 
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import "./App.css";



const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const defaultVoiceQuality = [
  { name: "00:00", quality: 72 },
  { name: "04:00", quality: 75 },
  { name: "08:00", quality: 80 },
  { name: "12:00", quality: 78 },
  { name: "16:00", quality: 76 },
  { name: "20:00", quality: 74 },
  { name: "24:00", quality: 73 },
];

const defaultCallVolume = [
  { name: "Mon", calls: 120 },
  { name: "Tue", calls: 150 },
  { name: "Wed", calls: 200 },
  { name: "Thu", calls: 170 },
  { name: "Fri", calls: 220 },
  { name: "Sat", calls: 90 },
  { name: "Sun", calls: 60 },
];

type ChartValues = Array<Record<string, number | string>>;

export default function App() {
  const [voiceQuality, setVoiceQuality] = useState<ChartValues>(defaultVoiceQuality);
  const [callVolume, setCallVolume] = useState<ChartValues>(defaultCallVolume);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prevValues, setPrevValues] = useState<ChartValues | null>(null);
  const [selectedChart, setSelectedChart] = useState<"voiceQuality" | "callVolume">("voiceQuality");
  const [editText, setEditText] = useState<string>(JSON.stringify(voiceQuality, null, 2));

  useEffect(() => {
    const data = selectedChart === "voiceQuality" ? voiceQuality : callVolume;
    setEditText(JSON.stringify(data, null, 2));
  }, [selectedChart, voiceQuality, callVolume]);

  async function fetchPreviousValues(emailToFetch: string, chartId: string) {
    setLoading(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from("user_chart_values")
        .select("values")
        .eq("email", emailToFetch)
        .eq("chart_id", chartId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn(error.message || error);
        setPrevValues(null);
      } else if (data) {
        setPrevValues(data.values as ChartValues);
      } else {
        setPrevValues(null);
      }
    } catch (err) {
      console.error(err);
      setStatus("Failed to fetch previous values");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadPrevious() {
    if (!email) {
      setStatus("Please enter your email first.");
      return;
    }
    const chartId = selectedChart;
    await fetchPreviousValues(email, chartId);
    if (prevValues) {
      setStatus("Previous values loaded.");
    } else {
      setStatus("No previous values found.");
    }
  }

  async function handleSave() {
    if (!email) {
      setStatus("Please enter your email before saving.");
      return;
    }

    let parsed: ChartValues;
    try {
      parsed = JSON.parse(editText) as ChartValues;
      if (!Array.isArray(parsed)) throw new Error("Parsed JSON must be an array of objects");
    } catch (err) {
      setStatus("Invalid JSON: " + (err as Error).message);
      return;
    }

    setLoading(true);
    setStatus("Checking existing values...");

    try {
      const chartId = selectedChart;
      const { data } = await supabase
        .from("user_chart_values")
        .select("values")
        .eq("email", email)
        .eq("chart_id", chartId)
        .single();

      const exists = !!data;
      if (exists) {
        const confirmOverwrite = window.confirm(
          "We found previously saved values. Overwrite?"
        );
        if (!confirmOverwrite) {
          setStatus("Cancelled.");
          setLoading(false);
          return;
        }
      }

      const upsertPayload = [{
        email,
        chart_id: chartId,
        values: parsed,
      }];

      const { error: upsertError } = await supabase
        .from("user_chart_values")
        .upsert(upsertPayload, { onConflict: "email,chart_id" });

      if (upsertError) {
        console.error(upsertError);
        setStatus("Failed to save values: " + upsertError.message);
      } else {
        setStatus("Saved successfully.");
        if (chartId === "voiceQuality") setVoiceQuality(parsed);
        else setCallVolume(parsed);
      }
    } catch (err) {
      console.error(err);
      setStatus("Error while saving.");
    } finally {
      setLoading(false);
    }
  }

  function resetChart(chart: "voiceQuality" | "callVolume") {
    if (chart === "voiceQuality") setVoiceQuality(defaultVoiceQuality);
    else setCallVolume(defaultCallVolume);
    setEditText(JSON.stringify(chart === "voiceQuality" ? defaultVoiceQuality : defaultCallVolume, null, 2));
    setStatus("Reset chart to default data.");
  }

  return (
    <div>
      <h1>Voice Agent Analytics Dashboard</h1>
      <p>This demo uses imaginary data. Enter your email to save custom values for a chart.</p>

      <div>
        <label htmlFor="chartSelect">Choose chart:</label>
        <select
          id="chartSelect"
          value={selectedChart}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedChart(e.target.value as "voiceQuality" | "callVolume")}
        >
          <option value="voiceQuality">Voice Quality</option>
          <option value="callVolume">Call Volume</option>
        </select>
        <button onClick={() => resetChart(selectedChart)}>Reset</button>
      </div>

      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {selectedChart === "voiceQuality" ? (
            <LineChart data={voiceQuality}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quality" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={callVolume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" barSize={40} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="editable-values">
        <h3>Editable values (JSON)</h3>
        <label htmlFor="editTextArea" className="sr-only">Editable JSON values</label>
        <textarea
          id="editTextArea"
          rows={8}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="edit-textarea"
          title="Editable JSON values"
          placeholder='[{"name":"00:00","quality":72}, {"name":"04:00","quality":75}]'
        />
      </div>

      <div>
        <label>Email:</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button onClick={handleLoadPrevious}>Load previous</button>
        <button onClick={handleSave} disabled={loading}>Save</button>
      </div>

      {loading && <div>Working...</div>}
      {status && <div>{status}</div>}
      {prevValues && (
        <div>
          <h4>Previous values:</h4>
          <pre>{JSON.stringify(prevValues, null, 2)}</pre>
        </div>
      )}

      <div>
        <h3>Voice Quality (current)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={voiceQuality}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="quality" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3>Call Volume (current)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={callVolume}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="calls" barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



