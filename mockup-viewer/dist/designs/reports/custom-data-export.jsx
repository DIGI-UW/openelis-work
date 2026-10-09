import React from 'react';

/**
 * Compatibility entry for the design gallery.
 *
 * The interactive HTML and its paired specification are the single accepted
 * Custom Data Export workflow. Keeping this thin wrapper lets existing gallery
 * and manifest links continue to resolve without maintaining a second mock.
 */
export default function CustomDataExportDesign() {
  return (
    <iframe
      src="./designs/reports/custom-data-export.html"
      title="Custom Data Export interactive design"
      style={{ width: '100%', height: '80vh', border: 0, background: '#f4f4f4' }}
    />
  );
}
