import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const defaultVoiceQuality = [
  { name: "00:00", quality: 72 },
  { name: "04:00", quality: 75 },
  { name: "08:00", quality: 80 },
  { name: "12:00", quality: 78 },
  { name: "16:00", quality: 76 },
  { name: "20:00", quality: 74 },
  { name: "24:00", quality: 73 }
];
const defaultCallVolume = [
  { name: "Mon", calls: 120 },
  { name: "Tue", calls: 150 },
  { name: "Wed", calls: 200 },
  { name: "Thu", calls: 170 },
  { name: "Fri", calls: 220 },
  { name: "Sat", calls: 90 },
  { name: "Sun", calls: 60 }
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

  // Email validation
  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Load previous values for a user/chart
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
        setPrevValues(null);
      } else if (data) {
        setPrevValues(data.values as ChartValues);
      } else {
        setPrevValues(null);
      }
    } catch {
      setStatus("Failed to fetch previous values");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadPrevious() {
    if (!isValidEmail(email)) {
      setStatus("Please enter a valid email first.");
      return;
    }
    await fetchPreviousValues(email, selectedChart);
    setStatus(prevValues ? "Previous values loaded." : "No previous values found.");
  }

  async function handleSave() {
    if (!isValidEmail(email)) {
      setStatus("Please enter a valid email before saving.");
      return;
    }

    let parsed: ChartValues;
    try {
      parsed = JSON.parse(editText) as ChartValues;
      if (!Array.isArray(parsed)) throw new Error("Parsed JSON must be an array of objects");
      if (parsed.some(item => typeof item.name !== "string")) throw new Error("Each item should have a 'name' string");
    } catch (err) {
      setStatus("Invalid JSON: " + (err as Error).message);
      return;
    }

    setLoading(true);

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
        setStatus("Failed to save values: " + upsertError.message);
      } else {
        setStatus("Saved successfully.");
        if (chartId === "voiceQuality") setVoiceQuality(parsed);
        else setCallVolume(parsed);
        setPrevValues(parsed);
      }
    } catch {
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

  // Disable editing until user enters a valid email
  const canEdit = isValidEmail(email);

  return (
    <div className="dashboard-bg">
      <div className="dashboard-card">
        <h1>Voice Agent Analytics Dashboard</h1>
        <p>This demo uses imaginary call analytics data. Enter your email to save custom chart values and view past edits.</p>
        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div className="input-group">
          <label htmlFor="chartSelect">Choose chart:</label>
          <select
            id="chartSelect"
            value={selectedChart}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedChart(e.target.value as "voiceQuality" | "callVolume")}
            className="select"
          >
            <option value="voiceQuality">Voice Quality</option>
            <option value="callVolume">Call Volume</option>
          </select>
          <button onClick={() => resetChart(selectedChart)} className="button">Reset</button>
        </div>
        <div className="chart-panel">
          <ResponsiveContainer width="100%" height={300}>
            {selectedChart === "voiceQuality" ? (
              <LineChart data={voiceQuality}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quality" stroke="#715af3" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={callVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls" barSize={40} fill="#41a1e4" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="editable-values">
          <h3>Editable values (JSON)</h3>
          <textarea
            id="editTextArea"
            rows={8}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="edit-textarea"
            disabled={!canEdit}
            title={!canEdit ? "Enter a valid email to unlock editing" : "Editable JSON values"}
            placeholder='[{"name":"00:00","quality":72}, {"name":"04:00","quality":75}]'
          />
        </div>
        <div className="input-group">
          <button onClick={handleLoadPrevious} className="button" disabled={!canEdit || loading}>Load previous</button>
          <button onClick={handleSave} className="button" disabled={!canEdit || loading}>Save</button>
        </div>
        {loading && <div className="status-message">Working...</div>}
        {status && <div className="status-message">{status}</div>}
        {prevValues && (
          <div>
            <h4>Previous values:</h4>
            <pre className="prev-values">{JSON.stringify(prevValues, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
