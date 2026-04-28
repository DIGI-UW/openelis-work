/**
 * Environmental LHU — Carbon React Mockup
 * Laporan Hasil Uji Lingkungan (Environmental Test Result Report)
 *
 * Source: lhu-crosswalk-raw.md (real data from PT. Unggulrejo Wasono & RS Permata Depok)
 * Base spec: S06-laporan-hasil-compliance-report-frs-v1.0.md
 * Carbon tokens: @carbon/react, IBM Plex Sans
 *
 * Two example matrices shown via toggle:
 *   1. PT. Unggulrejo Wasono — Limbah Cair (Wastewater) with KAN accreditation
 *   2. RS Permata Depok — Udara Ruang + Pencahayaan (Ambient Air + Physical Conditions)
 *
 * Configuration inheritance from patient-report-redesign:
 *   - headerName (String): selects header subreport template (default: GeneralHeader.jasper)
 *   - accreditationImage (image URL): accreditation logo (reused in header + sign-off)
 *   - accreditationNumber (String): e.g., "KAN LP-042-IDN"
 *   - accreditationLogoPosition (String): "TOP" | "BOTTOM" (default BOTTOM) — controls 4-column vs 3-column header layout
 *   See: patient-report-redesign-spec §7.1 / §7.1b / §7.7a and addendum-r5 §15.6
 *
 * Print-optimized: A4 portrait (~794×1123 px), @media print styles applied.
 * All visible strings externalized via t(key, fallback) for i18n.
 */

import React, { useState } from "react";

// =====================================================================
// i18n Stub
// =====================================================================
const t = (key, fallback) => fallback || key;

// =====================================================================
// Carbon Design Tokens
// =====================================================================
const COLORS = {
  blue60: "#0f62fe",
  blue70: "#0043ce",
  gray10: "#f4f4f4",
  gray20: "#e0e0e0",
  gray30: "#c6c6c6",
  gray50: "#8d8d8d",
  gray60: "#6f6f6f",
  gray70: "#525252",
  gray80: "#393939",
  gray90: "#262626",
  gray100: "#161616",
  white: "#ffffff",
  green50: "#24a148",
  green10: "#defbe6",
  red50: "#da1e28",
  red10: "#fff1f1",
  teal50: "#009d9a",
};

// =====================================================================
// Mock Data — PT. Unggulrejo Wasono (Wastewater)
// =====================================================================
const WASTEWATER_DATA = {
  // — Lab Letterhead (inherited from S-06)
  labName: "Balai Besar Laboratorium Kesehatan Masyarakat Yogyakarta",
  labSubtitle: "Instalasi Laboratorium Kesehatan Lingkungan, Vektor dan Binatang Pembawa Penyakit",
  labAddress: "Jl. Medan Sari No. 62, Bener, Kec. Tempel, Sleman, Yogyakarta 55511, Indonesia",
  labPhone: "+62 274 513535",
  labEmail: "bblkm.yogya@depkes.go.id",
  labWebsite: "bblkm.yogyakarta.go.id",
  accreditationNumber: "KAN LP-042-IDN",
  kanAccredited: true, // Will append /R to report number

  // — Report Info
  certificateNumber: "RS.02.02/B.X.2/7424/R/2026", // Real example with /R suffix
  issueDate: "2026-04-22",

  // — Customer (Yth. block)
  customerName: "PT. Unggulrejo Wasono",
  customerAddress: "Jl. Raya Purworejo - Kutoarjo Km.4, Purworejo, Jawa Tengah",

  // — Sample Info (inherited + matrix type)
  sampleNo: "2026-04116-FK",
  sampleMatrix: "WATER_WASTEWATER", // This is NEW field
  sampleType: "Limbah Cair (Wastewater)",
  sampleOrigin: "PT. Unggulrejo Wasono — Outlet",
  sampleCollector: "Lukita A (BB Labkesmas Yogyakarta)",
  sampleLocationGPS: "–", // Not provided in real data
  samplingMethod: "Grab Sample",
  dateCollected: "15-04-2026",
  dateReceived: "15-04-2026",
  dateTested: "14-04-2026 to 22-04-2026",

  // — Result Table (matrix-specific parameters)
  resultGroup: "Chemical Parameters", // Single group for wastewater
  results: [
    { no: 1, parameter: "BOD5 *", result: "11.2", bakuMutu: "60", unit: "mg/L", method: "SNI 6989.72-2009", keterangan: "*", status: "PASS" },
    { no: 2, parameter: "COD *", result: "21.5", bakuMutu: "150", unit: "mg/L", method: "SNI 6989.2-2019", keterangan: "*", status: "PASS" },
    { no: 3, parameter: "Fenol Total", result: "<0.0033", bakuMutu: "0.5", unit: "mg/L", method: "SNI 06-6989.21-2004", keterangan: "Batas deteksi", status: "PASS" },
    { no: 4, parameter: "Amonia Total (NH3 sebagai N) *", result: "0.255", bakuMutu: "8.0", unit: "mg/L", method: "SNI 06-6989.30-2005", keterangan: "*", status: "PASS" },
    { no: 5, parameter: "pH *", result: "6.7", bakuMutu: "6.0–9.0", unit: "—", method: "SNI 6989.11-2019", keterangan: "*", status: "PASS" },
    { no: 6, parameter: "TSS", result: "14", bakuMutu: "50", unit: "mg/L", method: "In House Method", keterangan: "—", status: "PASS" },
    { no: 7, parameter: "Krom Total (Cr) *", result: "<0.0095", bakuMutu: "1", unit: "mg/L", method: "SNI 6989.84-2019", keterangan: "* Batas deteksi", status: "PASS" },
  ],

  // — Regulatory Citation (matrix-specific)
  standardName: "Peraturan Menteri Lingkungan Hidup dan Kehutanan No. 68/2016",
  standards: [
    "Peraturan Menteri Lingkungan Hidup dan Kehutanan RI No. 68 Tahun 2016 tentang Baku Mutu Air Limbah",
    "SNI 6989.72-2009, SNI 6989.2-2019, SNI 06-6989.21-2004, SNI 06-6989.30-2005, SNI 6989.11-2019",
  ],

  // — Conclusion (bilingual)
  conclusionTitle: "KESIMPULAN / CONCLUSION",
  conclusionText: "Berdasarkan hasil pengujian, seluruh parameter memenuhi baku mutu sesuai Peraturan Menteri Lingkungan Hidup dan Kehutanan No. 68/2016. / Based on the test results, all parameters meet the quality standards per the Ministry of Environment & Forestry Regulation No. 68/2016.",

  // — E-Signatures
  testedByName: "Lukita Arianing, S.T.",
  testedByTitle: "Lab Analyst — Environmental Division",
  testedByTimestamp: "2026-04-22 10:30 WIB",
  approvedByName: "Dr. Arif Kusuma, S.Si, M.Sc.",
  approvedByTitle: "Kepala Instalasi Laboratorium Kesehatan Lingkungan",
  approvedByTimestamp: "2026-04-22 14:45 WIB",

  // — Page footer
  pageNo: 1,
  pageTotal: 1,
};

// =====================================================================
// Mock Data — RS Permata Depok (Multi-Matrix: Air + Pencahayaan)
// =====================================================================
const AMBIENT_AIR_DATA = {
  // — Lab Letterhead
  labName: "Balai Besar Laboratorium Kesehatan Masyarakat Jakarta",
  labSubtitle: "Instalasi Laboratorium Kesehatan Lingkungan, Vektor dan Binatang Pembawa Penyakit",
  labAddress: "Jl. Medan Sari No. 62, Jatinegara, Jakarta Timur 13320, Indonesia",
  labPhone: "+62 21 81055301",
  labEmail: "bblkm.jakarta@depkes.go.id",
  labWebsite: "bblkm.jakarta.go.id",
  accreditationNumber: "KAN LP-043-IDN",
  kanAccredited: false, // Not all params accredited

  // — Report Info
  certificateNumber: "KL.597 (B.611-613 U.215-218) / 2026", // Real multi-matrix example
  issueDate: "2026-04-07",

  // — Customer
  customerName: "RS (Rumah Sakit) Permata Depok",
  customerAddress: "Jl. Raya Muchtar No. 22, Sawangan Baru, Kec. Sawangan, Kota Depok",

  // — Sample Info
  sampleNo: "F0804",
  sampleMatrix: "AIR_AMBIENT", // Matrix 1
  sampleType: "Udara Ruang Mikrobiologi + Pencahayaan",
  sampleOrigin: "RS Permata Depok — Ruang OK 4 (Operating Room 4)",
  sampleCollector: "Husriani",
  sampleLocationGPS: "–6.3894, 106.7857", // Hypothetical
  samplingMethod: "SNI 9099:2024",
  dateCollected: "12-03-2026",
  dateReceived: "12-03-2026",
  dateTested: "12-03-2026 to 14-03-2026",

  // — Two sub-tables (Ambient Air Microbiological + Physical Conditions)
  groups: [
    {
      groupName: "Udara Ruang — Mikrobiologi (Ambient Air — Microbiology)",
      results: [
        { no: 1, parameter: "Jumlah Kuman", result: "134", bakuMutu: "≤200", unit: "CFU/m³", method: "SNI 9099:2024", keterangan: "—", status: "PASS" },
        { no: 2, parameter: "E. coli", result: "0", bakuMutu: "0", unit: "CFU/m³", method: "SNI 9099:2024", keterangan: "—", status: "PASS" },
        { no: 3, parameter: "Staphylococcus aureus", result: "8", bakuMutu: "≤10", unit: "CFU/m³", method: "SNI 9099:2024", keterangan: "—", status: "PASS" },
      ],
    },
    {
      groupName: "Kondisi Fisik Lingkungan (Physical Environmental Conditions)",
      results: [
        { no: 4, parameter: "Pencahayaan (Lighting)", result: "385", bakuMutu: "≥300", unit: "Lux", method: "Luxmeter calibrated", keterangan: "—", status: "PASS" },
        { no: 5, parameter: "Kebisingan (Noise Level)", result: "54", bakuMutu: "≤60", unit: "dB(A)", method: "Sound level meter", keterangan: "—", status: "PASS" },
        { no: 6, parameter: "Kelembaban Relatif (Humidity)", result: "62", bakuMutu: "45–60", unit: "%", method: "Hygrometer", keterangan: "⚠ At upper limit", status: "MARGINAL" },
      ],
    },
  ],

  // — Regulatory Citation
  standardName: "Peraturan Menteri Kesehatan RI No. 2 Tahun 2023",
  standards: [
    "Peraturan Menteri Kesehatan RI No. 2 Tahun 2023 tentang Baku Mutu Kesehatan Lingkungan dan Persyaratan Kesehatan Lingkungan",
    "SNI 9099:2024 — Metode pengujian angka lempeng total (ALT) dan identifikasi mikroba di udara dalam ruangan",
  ],

  // — Conclusion
  conclusionTitle: "KESIMPULAN / CONCLUSION",
  conclusionText: "Berdasarkan hasil pengujian, seluruh parameter memenuhi baku mutu sesuai Peraturan Menteri Kesehatan RI No. 2 Tahun 2023, namun 1 parameter (Kelembaban) mendekati batas maksimal. Rekomendasi: perbaikan sistem ventilasi. / Based on the test results, all parameters meet the quality standards per Ministerial Regulation No. 2/2023; however, 1 parameter (Humidity) is approaching the upper limit. Recommendation: improve ventilation system.",

  // — E-Signatures
  testedByName: "Yulia Enggel, S.Si, M.Biomed.",
  testedByTitle: "Penyelia Lab Biologi Lingkungan",
  testedByTimestamp: "2026-03-14 09:22 WIB",
  approvedByName: "Kurniawan Yulianto, S.K.M.",
  approvedByTitle: "Kepala Instalasi Kesehatan Lingkungan",
  approvedByTimestamp: "2026-04-07 16:30 WIB",

  // — Page footer
  pageNo: 1,
  pageTotal: 1,
};

// =====================================================================
// Helper: Status Symbol
// =====================================================================
function statusSymbol(status) {
  switch (status) {
    case "PASS":
      return "✓";
    case "FAIL":
      return "✗";
    case "MARGINAL":
      return "⚠";
    default:
      return "—";
  }
}

function statusColor(status) {
  switch (status) {
    case "PASS":
      return COLORS.green50;
    case "FAIL":
      return COLORS.red50;
    case "MARGINAL":
      return "#f1c21b"; // Carbon yellow
    default:
      return COLORS.gray60;
  }
}

// =====================================================================
// Main Component: EnvironmentalLHU
// =====================================================================
export default function EnvironmentalLHU() {
  const [activeExample, setActiveExample] = useState("wastewater"); // "wastewater" or "ambient_air"
  const [logoPosition, setLogoPosition] = useState("BOTTOM"); // "BOTTOM" or "TOP"
  const data = activeExample === "wastewater" ? WASTEWATER_DATA : AMBIENT_AIR_DATA;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: COLORS.gray10, minHeight: "100vh", padding: 16 }}>
      {/* Example & Config Switcher */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveExample("wastewater")}
          style={{
            padding: "8px 16px",
            background: activeExample === "wastewater" ? COLORS.blue60 : COLORS.gray20,
            color: activeExample === "wastewater" ? COLORS.white : COLORS.gray80,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 4,
            fontFamily: "inherit",
          }}
        >
          Example 1: PT. Unggulrejo Wasono (Wastewater — KAN Accredited)
        </button>
        <button
          onClick={() => setActiveExample("ambient_air")}
          style={{
            padding: "8px 16px",
            background: activeExample === "ambient_air" ? COLORS.blue60 : COLORS.gray20,
            color: activeExample === "ambient_air" ? COLORS.white : COLORS.gray80,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 4,
            fontFamily: "inherit",
          }}
        >
          Example 2: RS Permata Depok (Ambient Air + Physical — Multi-Matrix)
        </button>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: COLORS.gray80, display: "flex", alignItems: "center" }}>
            Accreditation Logo Position:
          </label>
          <button
            onClick={() => setLogoPosition("BOTTOM")}
            style={{
              padding: "6px 12px",
              background: logoPosition === "BOTTOM" ? COLORS.blue60 : COLORS.gray20,
              color: logoPosition === "BOTTOM" ? COLORS.white : COLORS.gray80,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 4,
              fontFamily: "inherit",
            }}
          >
            BOTTOM (default)
          </button>
          <button
            onClick={() => setLogoPosition("TOP")}
            style={{
              padding: "6px 12px",
              background: logoPosition === "TOP" ? COLORS.blue60 : COLORS.gray20,
              color: logoPosition === "TOP" ? COLORS.white : COLORS.gray80,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 4,
              fontFamily: "inherit",
            }}
          >
            TOP
          </button>
        </div>
      </div>

      {/* PDF-like Container */}
      <div
        style={{
          background: COLORS.white,
          width: "794px",
          margin: "0 auto",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          borderRadius: 2,
          padding: "20mm", // 20mm = A4 margin
          lineHeight: 1.4,
          color: COLORS.gray100,
        }}
      >
        <LHUDocument data={data} logoPosition={logoPosition} />
      </div>
    </div>
  );
}

// =====================================================================
// LHUDocument: Main Report Structure
// =====================================================================
function LHUDocument({ data, logoPosition = "BOTTOM" }) {
  return (
    <div>
      {/* --- LAB LETTERHEAD BLOCK (inherited from patient-report-redesign §7.1 / §7.1b) --- */}
      <LabLetterhead data={data} logoPosition={logoPosition} />

      {/* --- REPORT TITLE & NUMBER --- */}
      <ReportNumber data={data} />

      {/* --- CUSTOMER YTH. BLOCK (inherited from S-06) --- */}
      <CustomerBlock data={data} />

      {/* --- SAMPLE INFO BLOCK --- */}
      <SampleInfoBlock data={data} />

      {/* --- RESULT TABLE(S) --- */}
      <ResultTables data={data} />

      {/* --- REGULATORY STANDARDS CITED --- */}
      <StandardsCited data={data} />

      {/* --- COMPLIANCE CONCLUSION (bilingual) --- */}
      <Conclusion data={data} />

      {/* --- E-SIGNATURE BLOCK (inherited from patient-report-redesign §7.7a for bottom accreditation) --- */}
      <SignatureBlock data={data} logoPosition={logoPosition} />

      {/* --- PAGE FOOTER (inherited from patient-report-redesign §7.8) --- */}
      <PageFooter data={data} />
    </div>
  );
}

// =====================================================================
// LabLetterhead
// =====================================================================
/**
 * Lab letterhead with configurable header layout and accreditation logo position.
 *
 * Mirrors patient-report-redesign §7.1 / §7.1b pattern:
 * - Default (logoPosition='BOTTOM'): 3-column grid (left logo / facility-meta / right logo)
 * - Top variant (logoPosition='TOP'): 4-column grid with accreditation logo in 2nd column
 *
 * Props:
 *   data: report data object (labName, labAddress, accreditationNumber, kanAccredited)
 *   logoPosition: 'TOP' | 'BOTTOM' (default 'BOTTOM') — from accreditationLogoPosition param
 */
function LabLetterhead({ data, logoPosition = "BOTTOM" }) {
  const is4Column = logoPosition === "TOP";

  return (
    <div style={{ borderBottom: `2px solid ${COLORS.gray20}`, paddingBottom: 16, marginBottom: 16 }}>
      {/* Header Grid: 3-column (default) or 4-column (TOP variant) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: is4Column ? "80px 80px 1fr 80px" : "80px 1fr 80px",
        gap: 12,
        alignItems: "center",
        marginBottom: 12,
      }}>
        {/* Left: Lab logo placeholder */}
        <div style={{
          width: 80,
          height: 60,
          background: COLORS.gray10,
          border: `1px solid ${COLORS.gray20}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          color: COLORS.gray50,
          textAlign: "center",
          padding: 4,
        }}>
          [Lab Logo]
        </div>

        {/* 2nd column (if TOP): Accreditation logo placeholder */}
        {is4Column && (
          <div style={{
            width: 80,
            height: 60,
            background: data.kanAccredited ? COLORS.green10 : COLORS.gray10,
            border: `1px solid ${COLORS.gray20}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            color: COLORS.gray50,
            textAlign: "center",
            padding: 4,
          }}>
            {data.kanAccredited ? "[KAN Logo]" : "—"}
          </div>
        )}

        {/* Center: Lab name & facility info (or right: if 3-column) */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{data.labName}</h2>
          <p style={{ fontSize: 10, color: COLORS.gray60, margin: "0 0 4px", fontStyle: "italic" }}>
            {data.labSubtitle}
          </p>
          <p style={{ fontSize: 9, color: COLORS.gray70, margin: 0 }}>{data.labAddress}</p>
          <p style={{ fontSize: 9, color: COLORS.gray70, margin: "2px 0 0" }}>
            Akreditasi: {data.accreditationNumber}
          </p>
        </div>

        {/* Right: Right logo placeholder (or KAN if 3-column + accredited) */}
        <div style={{
          width: 80,
          height: 60,
          background: !is4Column && data.kanAccredited ? COLORS.green10 : COLORS.gray10,
          border: `1px solid ${COLORS.gray20}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          color: COLORS.gray50,
          textAlign: "center",
          padding: 4,
        }}>
          {!is4Column && data.kanAccredited ? "[KAN Logo]" : "[Partner Logo]"}
        </div>
      </div>

      {/* Contact info line (below grid) */}
      <div style={{ textAlign: "center", fontSize: 9, color: COLORS.gray70, margin: "8px 0 0" }}>
        <p style={{ margin: "2px 0" }}>
          {data.labPhone} | {data.labEmail}
        </p>
        <p style={{ margin: "2px 0" }}>{data.labWebsite}</p>
      </div>
    </div>
  );
}

// =====================================================================
// ReportNumber
// =====================================================================
function ReportNumber({ data }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 16, borderBottom: `1px solid ${COLORS.gray20}`, paddingBottom: 12 }}>
      {/* Section Title */}
      <h1 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", letterSpacing: 0.5 }}>
        LAPORAN HASIL UJI / TEST RESULT REPORT
      </h1>

      {/* Certificate Number (with /R suffix if accredited) */}
      <p style={{ fontSize: 11, margin: "4px 0", color: COLORS.gray80 }}>
        <strong>No.</strong> {data.certificateNumber}
      </p>

      {/* Issue Date */}
      <p style={{ fontSize: 11, margin: "0px 0", color: COLORS.gray80 }}>
        <strong>Tanggal Penerbitan / Date of Issue:</strong> {data.issueDate}
      </p>
    </div>
  );
}

// =====================================================================
// CustomerBlock (Yth. form)
// =====================================================================
function CustomerBlock({ data }) {
  return (
    <div style={{ marginBottom: 16, fontSize: 11, lineHeight: 1.6 }}>
      <p style={{ margin: 0, fontWeight: 500 }}>Yth. {data.customerName}</p>
      <p style={{ margin: 0 }}>{data.customerAddress}</p>
      <p style={{ margin: "8px 0 0", fontSize: 10, color: COLORS.gray60 }}>
        (Honored Customer / Kepada Yth. Pelanggan)
      </p>
    </div>
  );
}

// =====================================================================
// SampleInfoBlock
// =====================================================================
function SampleInfoBlock({ data }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, margin: "0 0 8px", color: COLORS.gray80 }}>
        INFORMASI SAMPEL / SAMPLE INFORMATION
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <tbody>
          <SampleRow label="No. Contoh Uji / Sample No." value={data.sampleNo} />
          <SampleRow label="Jenis Contoh / Sample Type" value={data.sampleType} />
          <SampleRow label="Asal Contoh Uji / Sample Origin" value={data.sampleOrigin} />
          <SampleRow label="Pengambil Contoh / Collector" value={data.sampleCollector} />
          <SampleRow label="Lokasi Pengambilan / Sampling Location" value={data.sampleLocationGPS} />
          <SampleRow label="Metode Pengambilan / Sampling Method" value={data.samplingMethod} />
          <SampleRow label="Tanggal diambil / Collected Date" value={data.dateCollected} />
          <SampleRow label="Tanggal diterima / Received Date" value={data.dateReceived} />
          <SampleRow label="Tanggal Pengujian / Test Date" value={data.dateTested} />
        </tbody>
      </table>
    </div>
  );
}

function SampleRow({ label, value }) {
  return (
    <tr style={{ borderBottom: `1px solid ${COLORS.gray20}` }}>
      <td style={{ padding: "6px 8px", fontWeight: 500, color: COLORS.gray70, width: "45%" }}>{label}</td>
      <td style={{ padding: "6px 8px", color: COLORS.gray90 }}>{value}</td>
    </tr>
  );
}

// =====================================================================
// ResultTables (can be multiple if multi-matrix)
// =====================================================================
function ResultTables({ data }) {
  const isMultiMatrix = data.groups && data.groups.length > 1;

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, margin: "0 0 12px", color: COLORS.gray80 }}>
        HASIL PENGUJIAN / TEST RESULTS
      </h3>

      {isMultiMatrix ? (
        // Multi-matrix case (RS Permata)
        data.groups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: 12, pageBreakInside: "avoid" }}>
            <h4 style={{ fontSize: 10, fontWeight: 600, margin: "0 0 6px", color: COLORS.gray70 }}>
              {group.groupName}
            </h4>
            <ResultTable results={group.results} />
          </div>
        ))
      ) : (
        // Single-matrix case (Wastewater)
        <>
          {data.resultGroup && (
            <h4 style={{ fontSize: 10, fontWeight: 600, margin: "0 0 6px", color: COLORS.gray70 }}>
              {data.resultGroup}
            </h4>
          )}
          <ResultTable results={data.results} />
        </>
      )}
    </div>
  );
}

function ResultTable({ results }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, marginBottom: 8 }}>
      <thead>
        <tr style={{ background: COLORS.gray10, borderBottom: `1px solid ${COLORS.gray20}` }}>
          <th style={thStyle}>No.</th>
          <th style={thStyle}>Parameter</th>
          <th style={thStyle}>Hasil Uji</th>
          <th style={thStyle}>Baku Mutu</th>
          <th style={thStyle}>Satuan</th>
          <th style={thStyle}>Metode</th>
          <th style={thStyle}>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        {results.map((row) => (
          <tr key={row.no} style={{ borderBottom: `1px solid ${COLORS.gray20}` }}>
            <td style={tdStyle}>{row.no}</td>
            <td style={tdStyle}>{row.parameter}</td>
            <td style={tdStyle}>{row.result}</td>
            <td style={tdStyle}>{row.bakuMutu}</td>
            <td style={tdStyle}>{row.unit}</td>
            <td style={tdStyle}>{row.method}</td>
            <td style={{ ...tdStyle, textAlign: "center", color: statusColor(row.status), fontWeight: 600 }}>
              {statusSymbol(row.status)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// =====================================================================
// StandardsCited
// =====================================================================
function StandardsCited({ data }) {
  return (
    <div style={{ marginBottom: 16, fontSize: 10, color: COLORS.gray80 }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, margin: "0 0 6px", color: COLORS.gray80 }}>
        BAKU MUTU / REGULATORY STANDARDS CITED
      </h3>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {data.standards.map((standard, idx) => (
          <li key={idx} style={{ margin: "2px 0" }}>
            {standard}
          </li>
        ))}
      </ul>
    </div>
  );
}

// =====================================================================
// Conclusion (Bilingual)
// =====================================================================
function Conclusion({ data }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, margin: "0 0 6px", color: COLORS.gray80 }}>
        {data.conclusionTitle}
      </h3>
      <p style={{ fontSize: 10, lineHeight: 1.5, margin: 0, color: COLORS.gray90 }}>
        {data.conclusionText}
      </p>
    </div>
  );
}

// =====================================================================
// SignatureBlock (E-Signature from S-06 + optional bottom accreditation logo)
// =====================================================================
/**
 * Signature block with optional bottom-right accreditation logo placement.
 *
 * Mirrors patient-report-redesign-addendum §7.7a pattern:
 * - When logoPosition='BOTTOM' (default), renders accreditation image + number
 *   floated right in the bottom-right area of the sign-off frame.
 * - When logoPosition='TOP', suppresses the bottom slot (logo is in header instead).
 *
 * Props:
 *   data: report data object (testedByName, approvedByName, accreditationNumber, kanAccredited)
 *   logoPosition: 'TOP' | 'BOTTOM' (default 'BOTTOM')
 */
function SignatureBlock({ data, logoPosition = "BOTTOM" }) {
  const showBottomLogo = logoPosition !== "TOP" && data.kanAccredited;

  return (
    <div style={{ marginBottom: 12, position: "relative" }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, margin: "0 0 8px", color: COLORS.gray80 }}>
        TANDA TANGAN / SIGNATURES
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: "50%",
                verticalAlign: "top",
                borderRight: `1px solid ${COLORS.gray20}`,
                paddingRight: 12,
              }}
            >
              <p style={{ margin: "0 0 4px", fontWeight: 500 }}>Diuji oleh / Tested by:</p>
              <p style={{ margin: "2px 0", color: COLORS.gray90 }}>{data.testedByName}</p>
              <p style={{ margin: "1px 0", fontSize: 8, color: COLORS.gray60 }}>{data.testedByTitle}</p>
              <p style={{ margin: "2px 0", fontSize: 8, color: COLORS.gray60 }}>{data.testedByTimestamp}</p>
              <p style={{ margin: "2px 0", fontSize: 8, color: COLORS.teal50 }}>Meaning: Authored</p>
            </td>

            <td
              style={{
                width: "50%",
                verticalAlign: "top",
                paddingLeft: 12,
                position: "relative",
              }}
            >
              <p style={{ margin: "0 0 4px", fontWeight: 500 }}>Disahkan oleh / Approved by:</p>
              <p style={{ margin: "2px 0", color: COLORS.gray90 }}>{data.approvedByName}</p>
              <p style={{ margin: "1px 0", fontSize: 8, color: COLORS.gray60 }}>{data.approvedByTitle}</p>
              <p style={{ margin: "2px 0", fontSize: 8, color: COLORS.gray60 }}>{data.approvedByTimestamp}</p>
              <p style={{ margin: "2px 0", fontSize: 8, color: COLORS.teal50 }}>
                Meaning: Validated & Released
              </p>

              {/* Bottom-right accreditation logo (BOTTOM position only) */}
              {showBottomLogo && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 70,
                      height: 40,
                      background: COLORS.green10,
                      border: `1px solid ${COLORS.gray20}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      color: COLORS.gray50,
                      marginBottom: 2,
                    }}
                  >
                    [KAN Logo]
                  </div>
                  <p style={{ margin: 0, fontSize: 8, color: COLORS.gray60 }}>
                    {data.accreditationNumber}
                  </p>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* E-Signature Disclaimer */}
      <div style={{ marginTop: 8, fontSize: 8, color: COLORS.gray60, fontStyle: "italic" }}>
        <p style={{ margin: "2px 0" }}>
          — Ditandatangani secara elektronik / Electronically Signed —
        </p>
        <p style={{ margin: "2px 0" }}>
          Dokumen ini telah ditandatangani secara elektronik dan sah tanpa tanda tangan basah. / This document
          has been electronically signed and is valid without a wet signature.
        </p>
      </div>
    </div>
  );
}

// =====================================================================
// PageFooter
// =====================================================================
function PageFooter({ data }) {
  return (
    <div
      style={{
        borderTop: `1px solid ${COLORS.gray20}`,
        paddingTop: 8,
        marginTop: 16,
        textAlign: "right",
        fontSize: 9,
        color: COLORS.gray60,
      }}
    >
      Halaman {data.pageNo} dari {data.pageTotal}
    </div>
  );
}

// =====================================================================
// Shared Styles
// =====================================================================
const thStyle = {
  padding: "6px 8px",
  textAlign: "left",
  fontWeight: 600,
  color: COLORS.gray70,
  textTransform: "uppercase",
  fontSize: "8px",
  letterSpacing: "0.3px",
};

const tdStyle = {
  padding: "6px 8px",
  color: COLORS.gray90,
  verticalAlign: "top",
};

// =====================================================================
// CSS for Print
// =====================================================================
const printStyles = `
@media print {
  body {
    margin: 0;
    padding: 0;
    background: white;
  }

  .pdf-page {
    page-break-after: always;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .pdf-page:last-child {
    page-break-after: auto;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    display: none;
  }
}
`;

// Inject print styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = printStyles;
  document.head.appendChild(style);
}
