"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as unknown as React.FC<any>;

const rgbSpecs = { range: [[0, 1], [0, 1], [0, 1]], labels: ["R", "G", "B"] };
const nativeSpecs = {
  RGB: { range: [[0, 1], [0, 1], [0, 1]], labels: ["R", "G", "B"] },
  CIELAB: { range: [[0, 100], [-128, 128], [-128, 128]], labels: ["L*", "a*", "b*"] },
  Oklab: { range: [[0, 1], [-0.4, 0.4], [-0.4, 0.4]], labels: ["L", "a", "b"] },
  JzAzBz: { range: [[0, 1], [-0.2, 0.2], [-0.2, 0.2]], labels: ["Jz", "az", "bz"] },
};

interface RGBData {
  [model: string]: number[][];
}
interface NativeData {
  [model: string]: number[][];
}
interface FailurePlotsResponse {
  rgb: RGBData;
  native: NativeData;
}

export default function FailurePlots() {
  const { t } = useTranslation();
  const [data, setData] = useState<FailurePlotsResponse | null>(null);
  const [viewMode, setViewMode] = useState<"rgb" | "native">("rgb");

  useEffect(() => {
    fetch("/api/leaderboard/failure-plots")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-40 w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const toggle = (
    <div className="flex justify-end mb-2">
      <div className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 rounded-full p-1 shadow-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("rgb")}
            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
              viewMode === "rgb"
                ? "text-white bg-gray-700/50"
                : "text-gray-300 hover:text-white hover:bg-gray-700/30"
            }`}
          >
            RGB
          </button>
          <button
            onClick={() => setViewMode("native")}
            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
              viewMode === "native"
                ? "text-white bg-gray-700/50"
                : "text-gray-300 hover:text-white hover:bg-gray-700/30"
            }`}
          >
            {t('leaderboard.viewMode.native')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
        {Object.keys(data.rgb).map((model) => {
          const points = viewMode === "rgb" ? data.rgb[model] : data.native[model];
          if (!Array.isArray(points) || !points.length) return null;
          const [x, y, z] = [0, 1, 2].map((i) => points.map((p) => p[i]));
          const { range, labels } = viewMode === "rgb" ? rgbSpecs : nativeSpecs[model as keyof typeof nativeSpecs];
          return (
            <div
              key={model}
              className="flex flex-col items-center p-2 md:p-4 w-full"
              style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}
            >
              <div className="flex justify-center items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-gray-700/60 px-3 py-1 text-xs font-semibold text-gray-200 text-center">
                  {model}
                </span>
              </div>
              <Plot
                data={[
                  {
                    x, y, z,
                    mode: "markers",
                    type: "scatter3d",
                    marker: { color: "red", size: 3, opacity: 0.6 },
                  },
                ]}
                layout={{
                  title: model + (viewMode === "rgb" ? " (RGB)" : " (Native)"),
                  scene: {
                    xaxis: { title: { text: labels[0] }, range: range[0] },
                    yaxis: { title: { text: labels[1] }, range: range[1] },
                    zaxis: { title: { text: labels[2] }, range: range[2] },
                    aspectmode: "cube",
                  },
                  autosize: true,
                  width: undefined,
                  height: 340,
                  margin: { l: 0, r: 0, t: 40, b: 0 },
                  paper_bgcolor: "rgba(0,0,0,0)",
                  plot_bgcolor: "rgba(0,0,0,0)",
                  font: { color: "#fff" },
                }}
                config={{ responsive: true }}
                style={{ width: '100%', maxWidth: 400, height: 340 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-center mt-8">{toggle}</div>
    </div>
  );
} 