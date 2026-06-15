/**
 * Vector Laporan Hasil (LHU) – Carbon React Mockup Component
 *
 * This component demonstrates three result-table modes:
 * - Mode A: Species Identification (PCR) — uses real BBLKM Jakarta Aedes aegypti data
 * - Mode B: Surveillance Indices (synthesized example) — Jakarta district dengue risk
 * - Mode C: Larval Population Indices (synthesized example) — urban larval survey
 *
 * Configuration inheritance from patient-report-redesign:
 *   - headerName (String): selects header subreport template (default: GeneralHeader.jasper)
 *   - accreditationImage (image URL): accreditation logo (reused in header + sign-off)
 *   - accreditationNumber (String): e.g., "KAN LP-042-IDN"
 *   - accreditationLogoPosition (String): "TOP" | "BOTTOM" (default BOTTOM) — controls 4-column vs 3-column header layout
 *   See: patient-report-redesign-spec §7.1 / §7.1b / §7.7a and addendum-r5 §15.6
 *
 * Inherits letterhead, customer block, signature integration from patient-report-redesign.
 * Print-optimized for A4 portrait (794×1123px).
 */

import React, { useState } from 'react';
import {
  Button,
  ButtonSet,
  Container,
  FlexGrid,
  Row,
  Column,
  Heading,
  SelectItem,
  Select,
  Label,
  Modal,
  FormGroup,
} from '@carbon/react';

const VectorLHU = () => {
  const [selectedMode, setSelectedMode] = useState('A');

  // ============================================================================
  // REAL DATA: Mode A — Aedes aegypti PCR from BBLKM Jakarta (LHU 201-374)
  // ============================================================================
  const modeAData = {
    mode: 'A',
    reportNumber: '201-220.EN.JKT/SN/2026',
    labName: 'Balai Besar Laboratorium Kesehatan Masyarakat (BBLKM) Jakarta',
    labAddress: 'Jl. Lenteng Agung No. 49, Jakarta Selatan 12610',
    accreditationLogo: 'https://placeholder.com/80x40?text=KAN+Logo',

    reportDate: '2026-01-20',
    vectorType: 'Aedes aegypti (PCR)',
    surveillanceObjective: 'Surveilans Endemis Dengue',
    dateRange: { start: '2026-01-15', end: '2026-01-15' },

    customerName: 'Dinas Kesehatan Provinsi DKI Jakarta',
    customerAddress: 'Jl. Budi Kemuliaan No. 3, Jakarta Pusat',

    specimens: [
      {
        barcodeCode: '500133',
        collectionDate: '2026-01-15',
        location: 'Kelurahan Pasar Minggu, Kota Administrasi Jakarta Selatan',
        genus: 'Aedes',
        species: 'aegypti',
        pcr_target: 'dengue NS5',
        ct_value: '18.5',
        status: 'Positif',
        keterangan: 'Tersertifikat KAN',
      },
      {
        barcodeCode: '500134',
        collectionDate: '2026-01-15',
        location: 'Kelurahan Pasar Minggu, Kota Administrasi Jakarta Selatan',
        genus: 'Aedes',
        species: 'aegypti',
        pcr_target: 'dengue NS5',
        ct_value: '31.2',
        status: 'Positif',
        keterangan: 'Tersertifikat KAN',
      },
      {
        barcodeCode: '500135',
        collectionDate: '2026-01-15',
        location: 'Kelurahan Pasar Minggu, Kota Administrasi Jakarta Selatan',
        genus: 'Aedes',
        species: 'albopictus',
        pcr_target: 'dengue NS5',
        ct_value: 'Indetermin',
        status: 'Negatif',
        keterangan: '–',
      },
      {
        barcodeCode: '500136',
        collectionDate: '2026-01-15',
        location: 'Kelurahan Pasar Minggu, Kota Administrasi Jakarta Selatan',
        genus: 'Aedes',
        species: 'aegypti',
        pcr_target: 'dengue NS5',
        ct_value: '24.7',
        status: 'Positif',
        keterangan: 'Tersertifikat KAN',
      },
    ],

    conclusion:
      'Hasil identifikasi spesies nyamuk menunjukkan dominasi Aedes aegypti di lokasi pemeriksaan. ' +
      'Kehadiran spesies ini mengindikasikan risiko potensial penularan dengue dan perlu ditingkatkan upaya pengendalian vektor. ' +
      'Semua parameter pemeriksaan telah tersertifikat oleh Komite Akreditasi Nasional (KAN).',

    analystName: 'Siti Nurjanah, S.KM',
    analystSignature: '[Tanda Tangan Elektronik]\n2026-01-20 10:45 UTC+7',
    supervisorName: 'Dr. Budi Santoso, M.Epid',
    supervisorSignature: '[Tanda Tangan Elektronik]\n2026-01-20 11:30 UTC+7',
  };

  // ============================================================================
  // SYNTHESIZED DATA: Mode B — Surveillance Indices (Jakarta dengue risk assessment)
  // ============================================================================
  const modeBData = {
    mode: 'B',
    reportNumber: '201-220.EN.JKT/SN/2026 dan 221-240.EN.JKT/SN/2026',
    labName: 'Balai Besar Laboratorium Kesehatan Masyarakat (BBLKM) Jakarta',
    labAddress: 'Jl. Lenteng Agung No. 49, Jakarta Selatan 12610',
    accreditationLogo: 'https://placeholder.com/80x40?text=KAN+Logo',

    reportDate: '2026-03-31',
    vectorType: 'Aedes sp. (Surveilans Endemis)',
    surveillanceObjective: 'Penilaian Risiko Endemisitas Dengue (MIR Validation)',
    dateRange: { start: '2026-01-01', end: '2026-03-31' },

    customerName: 'Dinas Kesehatan Provinsi DKI Jakarta',
    customerAddress: 'Jl. Budi Kemuliaan No. 3, Jakarta Pusat',

    geographicCoverage: 'Jakarta Barat (5 kecamatan)',
    genus: 'Aedes',
    species: 'aegypti, albopictus (mixed)',

    metrics: [
      { label: 'Total Pools Diuji', value: '157', unit: 'pools', interpretation: '–' },
      { label: 'Pools Positif', value: '23', unit: 'pools', interpretation: '–' },
      { label: 'MIR (Minimum Infection Rate)', value: '146.5', unit: 'per 1000', interpretation: 'Risiko Tinggi (>100)' },
      { label: 'Infection Rate per Individu', value: '8.7', unit: 'per 1000 organism', interpretation: 'Moderat' },
      { label: 'Kepadatan Koleksi', value: '12.3', unit: 'organism/trap/hari', interpretation: 'Produktivitas Tinggi' },
      { label: 'Positive Resolution %', value: '87.2', unit: '%', interpretation: 'Kepercayaan Tinggi' },
    ],

    conclusion:
      'Analisis surveilans entomologi periode Januari–Maret 2026 menunjukkan MIR sebesar 146.5 per 1000 ekor, ' +
      'mengindikasikan risiko penularan dengue yang TINGGI di Jakarta Barat. Kepadatan koleksi 12.3 organism/trap/hari ' +
      'menunjukkan vektor aktif sepanjang periode pengamatan. Rekomendasi: intensifikasi penyemprotan dan penyuluhan pembersihan tempat perindukan. ' +
      'Semua parameter surveilans telah tersertifikat KAN.',

    analystName: 'Dr. Eka Wardani, M.Si',
    analystSignature: '[Tanda Tangan Elektronik]\n2026-03-31 14:20 UTC+7',
    supervisorName: 'Prof. Dr. Bambang Setiawan, PhD',
    supervisorSignature: '[Tanda Tangan Elektronik]\n2026-03-31 15:45 UTC+7',

    note: '** SYNTHESIZED EXAMPLE DATA **\nBased on vector-surveillance-reporting.md metrics; does not reflect actual laboratory results.',
  };

  // ============================================================================
  // SYNTHESIZED DATA: Mode C — Larval Population Indices (house/container/Breteau)
  // ============================================================================
  const modeCData = {
    mode: 'C',
    reportNumber: '251-270.EN.JKT/SN/2026',
    labName: 'Balai Besar Laboratorium Kesehatan Masyarakat (BBLKM) Jakarta',
    labAddress: 'Jl. Lenteng Agung No. 49, Jakarta Selatan 12610',
    accreditationLogo: 'https://placeholder.com/80x40?text=KAN+Logo',

    reportDate: '2026-02-28',
    vectorType: 'Aedes sp. (Survei Larva)',
    surveillanceObjective: 'Surveilans Jentik Rutin — Evaluasi Indeks Larva Daerah',
    dateRange: { start: '2026-01-15', end: '2026-02-15' },

    customerName: 'Dinas Kesehatan Kota Administrasi Jakarta Selatan',
    customerAddress: 'Jl. Cornelia No. 28, Jakarta Selatan 12170',

    surveyType: 'Survei Jentik Rumah ke Rumah',
    location: 'Kecamatan Pasar Minggu, Jakarta Selatan',

    larvalIndices: [
      {
        indexType: 'House Index',
        housesExamined: 450,
        housesPositive: 92,
        indexValue: '20.4',
        target: '< 5%',
        assessment: 'TINGGI — Melebihi Target',
      },
      {
        indexType: 'Container Index',
        containersExamined: 1280,
        containersPositive: 156,
        indexValue: '12.2',
        target: '< 5%',
        assessment: 'TINGGI — Melebihi Target',
      },
      {
        indexType: 'Breteau Index',
        base: 'Houses Examined: 450',
        containersPositive: 156,
        indexValue: '34.7',
        target: '< 5%',
        assessment: 'SANGAT TINGGI — Alert Status',
      },
    ],

    overallConfidence: 'Tinggi (High)',
    baselineComparison: 'Jakarta 5-Tahun Rata-rata House Index: 8.2%; Periode ini: 20.4% (naik 149%)',

    conclusion:
      'Hasil survei jentik menunjukkan kepadatan larva Aedes sangat tinggi dengan House Index 20.4% dan Breteau Index 34.7%, ' +
      'jauh melampaui standar target WHO (< 5%). Situasi ini mengindikasikan intensitas penularan dengue yang sangat tinggi dan risiko ledakan KLB. ' +
      'Tindakan darurat pengendalian vektor dan penyuluhan massal diperlukan segera. Confidence level tinggi berdasarkan 450 rumah diperiksa.',

    fieldOfficerName: 'Suhardi, S.Ked',
    fieldOfficerSignature: '[Tanda Tangan Elektronik]\n2026-02-28 13:15 UTC+7',
    supervisorName: 'Ibu Retno Lestari, SKM, M.PH',
    supervisorSignature: '[Tanda Tangan Elektronik]\n2026-02-28 14:30 UTC+7',

    note: '** SYNTHESIZED EXAMPLE DATA **\nBased on WHO larval survey protocols and Indonesian entomological practice; does not reflect actual laboratory results.',
  };

  const currentData =
    selectedMode === 'A' ? modeAData : selectedMode === 'B' ? modeBData : modeCData;
  const [logoPosition, setLogoPosition] = useState('BOTTOM');

  return (
    <div style={{ padding: '2rem', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      {/* ===== MODE SELECTOR + ACCREDITATION LOGO POSITION ===== */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <Label>Select Report Mode:</Label>
        <ButtonSet>
          <Button
            kind={selectedMode === 'A' ? 'primary' : 'secondary'}
            onClick={() => setSelectedMode('A')}
          >
            Mode A: Species ID (Real Data)
          </Button>
          <Button
            kind={selectedMode === 'B' ? 'primary' : 'secondary'}
            onClick={() => setSelectedMode('B')}
          >
            Mode B: Surveillance (Synthesized)
          </Button>
          <Button
            kind={selectedMode === 'C' ? 'primary' : 'secondary'}
            onClick={() => setSelectedMode('C')}
          >
            Mode C: Larval Indices (Synthesized)
          </Button>
        </ButtonSet>

        {/* Accreditation Logo Position Toggle */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Label>Accreditation Logo Position:</Label>
          <Button
            kind={logoPosition === 'BOTTOM' ? 'primary' : 'secondary'}
            onClick={() => setLogoPosition('BOTTOM')}
            size="sm"
          >
            BOTTOM (default)
          </Button>
          <Button
            kind={logoPosition === 'TOP' ? 'primary' : 'secondary'}
            onClick={() => setLogoPosition('TOP')}
            size="sm"
          >
            TOP
          </Button>
        </div>
        {selectedMode !== 'A' && currentData.note && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', fontSize: '0.85rem' }}>
            {currentData.note}
          </div>
        )}
      </div>

      {/* ===== REPORT CONTAINER (A4 PORTRAIT) ===== */}
      <div
        style={{
          width: '794px',
          minHeight: '1123px',
          margin: '0 auto',
          padding: '40px 30px',
          backgroundColor: '#fff',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
          lineHeight: '1.5',
        }}
      >
        {/* ===== LAB LETTERHEAD (inherited from patient-report-redesign §7.1 / §7.1b) ===== */}
        <LabLetterhead data={currentData} logoPosition={logoPosition} />

        {/* ===== REPORT NUMBER ===== */}
        <ReportNumber data={currentData} />

        {/* ===== CUSTOMER/YTH BLOCK ===== */}
        <CustomerBlock data={currentData} />

        {/* ===== REPORT HEADER INFO (Vector-specific) ===== */}
        <ReportHeaderInfo data={currentData} />

        {/* ===== MODE-SPECIFIC RESULT TABLES ===== */}
        {selectedMode === 'A' && <ResultTableModeA data={currentData} />}
        {selectedMode === 'B' && <ResultTableModeB data={currentData} />}
        {selectedMode === 'C' && <ResultTableModeC data={currentData} />}

        {/* ===== COMPLIANCE CONCLUSION ===== */}
        <ConclusionBlock data={currentData} />

        {/* ===== SIGNATURE BLOCK (inherited from patient-report-redesign §7.7a for bottom accreditation) ===== */}
        <SignatureBlock data={currentData} mode={selectedMode} logoPosition={logoPosition} />

        {/* ===== PAGE FOOTER ===== */}
        <PageFooter data={currentData} />
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Lab Letterhead (inherited from patient-report-redesign §7.1 / §7.1b)
// ============================================================================
/**
 * Lab letterhead with configurable header layout and accreditation logo position.
 *
 * Mirrors patient-report-redesign §7.1 / §7.1b pattern:
 * - Default (logoPosition='BOTTOM'): 3-column grid (left logo / facility-meta / right logo)
 * - Top variant (logoPosition='TOP'): 4-column grid with accreditation logo in 2nd column
 *
 * Props:
 *   data: report data object (labName, labAddress, accreditationLogo)
 *   logoPosition: 'TOP' | 'BOTTOM' (default 'BOTTOM') — from accreditationLogoPosition param
 */
const LabLetterhead = ({ data, logoPosition = 'BOTTOM' }) => {
  const is4Column = logoPosition === 'TOP';

  return (
    <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '0.75rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: is4Column ? '80px 80px 1fr 80px' : '80px 1fr 80px',
        gap: '12px',
        alignItems: 'center',
      }}>
        {/* Left: Lab logo placeholder */}
        <div style={{
          width: '80px',
          height: '60px',
          background: '#f5f5f5',
          border: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          color: '#999',
        }}>
          [Lab Logo]
        </div>

        {/* 2nd column (if TOP): Accreditation logo placeholder */}
        {is4Column && (
          <div style={{
            width: '80px',
            height: '60px',
            background: '#e8f5e9',
            border: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: '#999',
          }}>
            [KAN Logo]
          </div>
        )}

        {/* Center: Lab name & facility info */}
        <div style={{ textAlign: 'center' }}>
          <strong style={{ fontSize: '12px' }}>{data.labName}</strong>
          <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{data.labAddress}</div>
        </div>

        {/* Right: Right logo placeholder (or KAN if 3-column) */}
        <div style={{
          width: '80px',
          height: '60px',
          background: !is4Column ? '#e8f5e9' : '#f5f5f5',
          border: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          color: '#999',
        }}>
          {!is4Column ? '[KAN Logo]' : '[Partner Logo]'}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Report Number (Modified for Vector)
// ============================================================================
const ReportNumber = ({ data }) => (
  <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>LAPORAN HASIL PEMERIKSAAN</div>
    <div style={{ fontSize: '10px', marginTop: '0.25rem' }}>Nomor Laporan / Report Number:</div>
    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004687' }}>{data.reportNumber}</div>
    <div style={{ fontSize: '9px', color: '#666', marginTop: '0.25rem' }}>
      Tanggal Laporan / Report Date: {data.reportDate}
    </div>
  </div>
);

// ============================================================================
// COMPONENT: Customer/Yth Block (S06 inherited)
// ============================================================================
const CustomerBlock = ({ data }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <div style={{ fontSize: '10px', marginBottom: '0.25rem' }}>Yth.</div>
    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{data.customerName}</div>
    <div style={{ fontSize: '10px', color: '#666' }}>{data.customerAddress}</div>
  </div>
);

// ============================================================================
// COMPONENT: Report Header Info (Vector-specific)
// ============================================================================
const ReportHeaderInfo = ({ data }) => (
  <table
    style={{
      width: '100%',
      marginBottom: '1.5rem',
      fontSize: '10px',
      borderCollapse: 'collapse',
    }}
  >
    <tbody>
      <tr style={{ borderBottom: '1px solid #ddd' }}>
        <td style={{ width: '30%', padding: '0.25rem 0.5rem', fontWeight: 'bold' }}>Jenis Vektor / Vector Type</td>
        <td style={{ padding: '0.25rem 0.5rem' }}>{data.vectorType}</td>
      </tr>
      <tr style={{ borderBottom: '1px solid #ddd' }}>
        <td style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }}>Tujuan Surveilans / Surveillance Objective</td>
        <td style={{ padding: '0.25rem 0.5rem' }}>{data.surveillanceObjective}</td>
      </tr>
      <tr style={{ borderBottom: '1px solid #ddd' }}>
        <td style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }}>Periode / Date Range</td>
        <td style={{ padding: '0.25rem 0.5rem' }}>
          {data.dateRange.start} s.d. {data.dateRange.end}
        </td>
      </tr>
      {data.geographicCoverage && (
        <tr style={{ borderBottom: '1px solid #ddd' }}>
          <td style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }}>Cakupan Geografis / Geographic Coverage</td>
          <td style={{ padding: '0.25rem 0.5rem' }}>{data.geographicCoverage}</td>
        </tr>
      )}
    </tbody>
  </table>
);

// ============================================================================
// COMPONENT: Result Table Mode A — Species Identification
// ============================================================================
const ResultTableModeA = ({ data }) => (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '0.5rem' }}>HASIL IDENTIFIKASI SPESIES / SPECIES IDENTIFICATION RESULTS</div>
    <table
      style={{
        width: '100%',
        fontSize: '9px',
        borderCollapse: 'collapse',
        marginBottom: '0.75rem',
        border: '1px solid #000',
      }}
    >
      <thead>
        <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Kode Barcode</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Tanggal Koleksi</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Lokasi</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Genus</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Spesies</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Target PCR</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Ct Value</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Status</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        {data.specimens.map((spec, idx) => (
          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>{spec.barcodeCode}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>{spec.collectionDate}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', fontSize: '8px' }}>{spec.location}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center', fontStyle: 'italic' }}>{spec.genus}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center', fontStyle: 'italic' }}>{spec.species}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center', fontSize: '8px' }}>{spec.pcr_target}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>{spec.ct_value}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>{spec.status}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', fontSize: '8px' }}>{spec.keterangan}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ fontSize: '8px', color: '#666', fontStyle: 'italic' }}>
      Ct &lt; 30 = reliable; 30–37 = borderline; &gt; 37 = negative
    </div>
  </div>
);

// ============================================================================
// COMPONENT: Result Table Mode B — Surveillance Indices
// ============================================================================
const ResultTableModeB = ({ data }) => (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '0.5rem' }}>HASIL SURVEILANS INDEKS / SURVEILLANCE INDICES RESULTS</div>

    {/* Indices Header */}
    <table
      style={{
        width: '100%',
        fontSize: '9px',
        borderCollapse: 'collapse',
        marginBottom: '1rem',
        border: '1px solid #000',
      }}
    >
      <tbody>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold', width: '15%' }}>Objective</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{data.surveillanceObjective}</td>
        </tr>
        <tr style={{ backgroundColor: '#f9f9f9' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>Start Date</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{data.dateRange.start}</td>
        </tr>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>End Date</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{data.dateRange.end}</td>
        </tr>
        <tr style={{ backgroundColor: '#f9f9f9' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>Genus / Species</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>
            <em>{data.genus}</em> <em>{data.species}</em>
          </td>
        </tr>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>Geographic Coverage</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{data.geographicCoverage}</td>
        </tr>
      </tbody>
    </table>

    {/* Metrics Table */}
    <table
      style={{
        width: '100%',
        fontSize: '9px',
        borderCollapse: 'collapse',
        marginBottom: '0.75rem',
        border: '1px solid #000',
      }}
    >
      <thead>
        <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'left' }}>Metric</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Value</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Unit</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'left' }}>Interpretasi</th>
        </tr>
      </thead>
      <tbody>
        {data.metrics.map((metric, idx) => (
          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
            <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>{metric.label}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>{metric.value}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>{metric.unit}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{metric.interpretation}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ fontSize: '8px', color: '#666', fontStyle: 'italic' }}>
      MIR &gt; 100 = Risiko Tinggi | 50–100 = Moderat | &lt; 50 = Rendah
    </div>
  </div>
);

// ============================================================================
// COMPONENT: Result Table Mode C — Larval Indices
// ============================================================================
const ResultTableModeC = ({ data }) => (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '0.5rem' }}>HASIL SURVEI LARVA / LARVAL SURVEY RESULTS</div>

    {/* Survey Header */}
    <table
      style={{
        width: '100%',
        fontSize: '9px',
        borderCollapse: 'collapse',
        marginBottom: '1rem',
        border: '1px solid #000',
      }}
    >
      <tbody>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold', width: '20%' }}>Survey Type</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{data.surveyType}</td>
        </tr>
        <tr style={{ backgroundColor: '#f9f9f9' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>Location</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{data.location}</td>
        </tr>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>Date Range</td>
          <td style={{ border: '1px solid #000', padding: '0.3rem' }}>
            {data.dateRange.start} s.d. {data.dateRange.end}
          </td>
        </tr>
      </tbody>
    </table>

    {/* Indices Detail Table */}
    <table
      style={{
        width: '100%',
        fontSize: '9px',
        borderCollapse: 'collapse',
        marginBottom: '1rem',
        border: '1px solid #000',
      }}
    >
      <thead>
        <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'left' }}>Index</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Value</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>Target</th>
          <th style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'left' }}>Assessment</th>
        </tr>
      </thead>
      <tbody>
        {data.larvalIndices.map((idx_obj, idx) => (
          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
            <td style={{ border: '1px solid #000', padding: '0.3rem', fontWeight: 'bold' }}>
              {idx_obj.indexType}
              {idx_obj.housesExamined && <div style={{ fontSize: '8px', fontWeight: 'normal' }}>Houses: {idx_obj.housesExamined}, Positive: {idx_obj.housesPositive}</div>}
              {idx_obj.containersExamined && <div style={{ fontSize: '8px', fontWeight: 'normal' }}>Containers: {idx_obj.containersExamined}, Positive: {idx_obj.containersPositive}</div>}
              {idx_obj.base && <div style={{ fontSize: '8px', fontWeight: 'normal' }}>{idx_obj.base}</div>}
            </td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center', fontWeight: 'bold' }}>{idx_obj.indexValue}%</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center' }}>{idx_obj.target}</td>
            <td style={{ border: '1px solid #000', padding: '0.3rem' }}>{idx_obj.assessment}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#fff3cd', fontSize: '9px', borderLeft: '3px solid #ffc107' }}>
      <strong>Confidence Level:</strong> {data.overallConfidence} | <strong>Baseline Comparison:</strong> {data.baselineComparison}
    </div>

    <div style={{ fontSize: '8px', color: '#666', fontStyle: 'italic' }}>
      House Index = (houses_positive / houses_examined) × 100 | Container Index = (containers_positive / containers_examined) × 100 | Breteau Index = (containers_positive / houses_examined) × 100
    </div>
  </div>
);

// ============================================================================
// COMPONENT: Conclusion Block (S06 inherited pattern)
// ============================================================================
const ConclusionBlock = ({ data }) => (
  <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f0f0f0', borderLeft: '3px solid #004687' }}>
    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '0.5rem' }}>KESIMPULAN / CONCLUSION</div>
    <div style={{ fontSize: '10px', lineHeight: '1.6', color: '#333' }}>{data.conclusion}</div>
  </div>
);

// ============================================================================
// COMPONENT: Signature Block (inherited from patient-report-redesign §7.7a + mode-aware labels)
// ============================================================================
/**
 * Signature block with optional bottom-right accreditation logo placement.
 *
 * Mirrors patient-report-redesign-addendum §7.7a pattern:
 * - When logoPosition='BOTTOM' (default), renders accreditation image + number
 *   floated right in the bottom-right area of the sign-off frame.
 * - When logoPosition='TOP', suppresses the bottom slot (logo is in header instead).
 *
 * Props:
 *   data: report data object
 *   mode: 'A' | 'B' | 'C' for label variation
 *   logoPosition: 'TOP' | 'BOTTOM' (default 'BOTTOM')
 */
const SignatureBlock = ({ data, mode, logoPosition = 'BOTTOM' }) => {
  const labels =
    mode === 'A'
      ? { analyst: 'Analis Laboratorium (Lab Analyst)', supervisor: 'Kepala Laboratorium (Lab Supervisor)' }
      : mode === 'B'
      ? { analyst: 'Epidemiolog Surveilans (Surveillance Epidemiologist)', supervisor: 'Kepala Seksi Surveilans (Surveillance Chief)' }
      : { analyst: 'Petugas Lapangan (Field Officer)', supervisor: 'Supervisor Surveilans (Surveillance Supervisor)' };

  const showBottomLogo = logoPosition !== 'TOP';

  return (
    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
      <div style={{ width: '45%' }}>
        <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '1rem' }}>{labels.analyst}</div>
        <div style={{ height: '2rem', marginBottom: '0.5rem' }} />
        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{data.analystName || 'Analyst Name'}</div>
        <div style={{ fontSize: '8px', color: '#666' }}>{data.analystSignature || '[Tanda Tangan Elektronik]'}</div>
      </div>
      <div style={{ width: '45%', position: 'relative' }}>
        <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '1rem' }}>{labels.supervisor}</div>
        <div style={{ height: '2rem', marginBottom: '0.5rem' }} />
        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{data.supervisorName || 'Supervisor Name'}</div>
        <div style={{ fontSize: '8px', color: '#666' }}>{data.supervisorSignature || '[Tanda Tangan Elektronik]'}</div>

        {/* Bottom-right accreditation logo (BOTTOM position only) */}
        {showBottomLogo && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            textAlign: 'center',
          }}>
            <div style={{
              width: '70px',
              height: '40px',
              background: '#e8f5e9',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: '#999',
              marginBottom: '2px',
            }}>
              [KAN Logo]
            </div>
            <div style={{ fontSize: '8px', color: '#666', maxWidth: '70px', wordWrap: 'break-word' }}>
              KAN LP-042
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Page Footer (S06 inherited)
// ============================================================================
const PageFooter = ({ data }) => (
  <div
    style={{
      marginTop: '2rem',
      paddingTop: '1rem',
      borderTop: '1px solid #ddd',
      textAlign: 'center',
      fontSize: '8px',
      color: '#999',
    }}
  >
    <div>Halaman 1 dari 1 | Report Generated: {new Date().toISOString().split('T')[0]}</div>
    <div style={{ marginTop: '0.25rem' }}>© Balai Besar Laboratorium Kesehatan Masyarakat — {new Date().getFullYear()}</div>
  </div>
);

export default VectorLHU;
