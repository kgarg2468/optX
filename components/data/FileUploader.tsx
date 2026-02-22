"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ParsedData {
  headers: string[];
  rows: Record<string, string | number>[];
  rowCount: number;
}

interface FileUploaderProps {
  onParsed: (data: ParsedData, fileName: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploader({
  onParsed,
  accept = ".csv,.xlsx,.xls",
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (f: File) => {
      setIsProcessing(true);
      setError(null);
      setFile(f);

      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`File exceeds ${maxSizeMB}MB limit`);
        setIsProcessing(false);
        return;
      }

      try {
        const ext = f.name.split(".").pop()?.toLowerCase();

        if (ext === "csv") {
          Papa.parse(f, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
              const data: ParsedData = {
                headers: results.meta.fields || [],
                rows: results.data as Record<string, string | number>[],
                rowCount: results.data.length,
              };
              setParsed(data);
              onParsed(data, f.name);
              setIsProcessing(false);
            },
            error: (err) => {
              setError(`CSV parse error: ${err.message}`);
              setIsProcessing(false);
            },
          });
        } else if (ext === "xlsx" || ext === "xls") {
          const buffer = await f.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);
          const headers =
            jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

          const data: ParsedData = {
            headers,
            rows: jsonData,
            rowCount: jsonData.length,
          };
          setParsed(data);
          onParsed(data, f.name);
          setIsProcessing(false);
        } else {
          setError("Unsupported file format. Use CSV or Excel files.");
          setIsProcessing(false);
        }
      } catch (err) {
        setError(`Failed to process file: ${err instanceof Error ? err.message : "Unknown error"}`);
        setIsProcessing(false);
      }
    },
    [maxSizeMB, onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const reset = () => {
    setFile(null);
    setParsed(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (parsed && file) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-chart-2" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {parsed.rowCount} rows, {parsed.headers.length} columns
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Data preview */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {parsed.headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {parsed.headers.map((h) => (
                    <td key={h} className="px-3 py-2">
                      {String(row[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {parsed.rowCount > 5 && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
              Showing 5 of {parsed.rowCount} rows
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drop a file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              CSV or Excel files up to {maxSizeMB}MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
