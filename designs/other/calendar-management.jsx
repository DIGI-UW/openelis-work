import React, { useState } from 'react';
import {
  Download, Plus, Edit, Trash2, Upload, CalendarDays, X, CheckCircle2
} from 'lucide-react';

// ============================================
// COLOR PALETTE (OpenELIS / Carbon-like)
// ============================================
const colors = {
  tealPrimary: '#0E6B5E',
  tealDark: '#0A5249',
  tealLight: '#E6F5F2',
  tealMedium: '#B8DDD6',
  blue: '#0F62FE',
  blueLight: '#EDF5FF',
  green: '#198038',
  greenLight: '#DEFBE6',
  yellow: '#F1C21B',
  yellowLight: '#FFF8E1',
  orange: '#FF832B',
  orangeLight: '#FFF3EB',
  red: '#DA1E28',
  redLight: '#FFF1F1',
  purple: '#8A3FFC',
  purpleLight: '#F6F2FF',
  gray900: '#161616',
  gray800: '#262626',
  gray700: '#393939',
  gray600: '#525252',
  gray500: '#6F6F6F',
  gray400: '#8D8D8D',
  gray300: '#A8A8A8',
  gray200: '#C6C6C6',
  gray100: '#E0E0E0',
  gray50: '#F4F4F4',
  white: '#FFFFFF',
};
// ============================================
// SAMPLE HOLIDAY DATA
// ============================================
const holidayData = [
  { id: 1, date: '2026-01-01', name: "New Year's Day", recurring: true, active: true },
  { id: 2, date: '2026-04-07', name: 'Genocide Memorial Day', recurring: true, active: true },
  { id: 3, date: '2026-05-01', name: 'Labour Day', recurring: true, active: true },
  { id: 4, date: '2026-07-01', name: 'Independence Day', recurring: true, active: true },
  { id: 5, date: '2026-07-04', name: 'Liberation Day', recurring: true, active: true },
  { id: 6, date: '2026-08-15', name: 'Assumption Day', recurring: true, active: true },
  { id: 7, date: '2026-10-01', name: "Heroes' Day", recurring: true, active: true },
  { id: 8, date: '2026-12-25', name: 'Christmas Day', recurring: true, active: true },
  { id: 9, date: '2026-12-26', name: 'Boxing Day', recurring: true, active: true },
  { id: 10, date: '2026-03-31', name: 'Eid al-Fitr (2026)', recurring: false, active: true },
  { id: 11, date: '2026-06-07', name: 'Eid al-Adha (2026)', recurring: false, active: true },
];

// ============================================
// MAIN COMPONENT
const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variantStyles = {
    default: { bg: colors.gray100, color: colors.gray600 },
    success: { bg: colors.greenLight, color: colors.green },
    warning: { bg: colors.yellowLight, color: '#946200' },
    danger: { bg: colors.redLight, color: colors.red },
    info: { bg: colors.blueLight, color: colors.blue },
    teal: { bg: colors.tealLight, color: colors.tealPrimary },
    purple: { bg: colors.purpleLight, color: colors.purple },
    orange: { bg: colors.orangeLight, color: colors.orange },
  };
  const s = variantStyles[variant] || variantStyles.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: size === 'sm' ? '1px 8px' : '2px 10px',
      borderRadius: '9999px', fontSize: size === 'sm' ? '11px' : '12px',
      fontWeight: 500, backgroundColor: s.bg, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
};

// ============================================
// CALENDAR MANAGEMENT (Admin)
// ============================================
const CalendarManagement = () => {
  const [holidays, setHolidays] = useState(holidayData);
  const [calendarYear, setCalendarYear] = useState('2026');
  const [editingHoliday, setEditingHoliday] = useState(null); // null, 'new', or holiday object
  const [weekendSaturday, setWeekendSaturday] = useState(true);
  const [weekendSunday, setWeekendSunday] = useState(true);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', recurring: false });


    const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
    const isAdding = editingHoliday === 'new';
    const editingId = editingHoliday && editingHoliday !== 'new' ? editingHoliday.id : null;

    const InlineRow = ({ isNew }) => (
      <tr style={{
        borderBottom: `1px solid ${colors.gray100}`,
        backgroundColor: colors.tealLight,
      }}>
        <td style={{ padding: '8px 16px' }}>
          <input
            type="date"
            value={newHoliday.date}
            onChange={e => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
            autoFocus={isNew}
            style={{
              width: '100%', padding: '6px 8px', border: `1px solid ${colors.tealMedium}`,
              borderRadius: '4px', fontSize: '13px', backgroundColor: colors.white, boxSizing: 'border-box',
            }}
          />
        </td>
        <td style={{ padding: '8px 16px' }}>
          <input
            type="text"
            value={newHoliday.name}
            onChange={e => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Holiday name..."
            autoFocus={!isNew}
            style={{
              width: '100%', padding: '6px 8px', border: `1px solid ${colors.tealMedium}`,
              borderRadius: '4px', fontSize: '13px', backgroundColor: colors.white, boxSizing: 'border-box',
            }}
          />
        </td>
        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', color: colors.gray600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newHoliday.recurring}
              onChange={e => setNewHoliday(prev => ({ ...prev, recurring: e.target.checked }))}
            />
            Annual
          </label>
        </td>
        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
          <Badge variant="success" size="sm">Active</Badge>
        </td>
        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
            <button
              onClick={() => {
                if (!newHoliday.date || !newHoliday.name.trim()) return;
                if (isNew) {
                  setHolidays(prev => [...prev, { id: Date.now(), ...newHoliday, active: true }]);
                } else {
                  setHolidays(prev => prev.map(h => h.id === editingId ? { ...h, ...newHoliday } : h));
                }
                setEditingHoliday(null);
                setNewHoliday({ date: '', name: '', recurring: false });
              }}
              disabled={!newHoliday.date || !newHoliday.name.trim()}
              style={{
                padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                backgroundColor: (!newHoliday.date || !newHoliday.name.trim()) ? colors.gray200 : colors.tealPrimary,
                color: (!newHoliday.date || !newHoliday.name.trim()) ? colors.gray400 : colors.white,
                fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <CheckCircle2 size={13} /> Save
            </button>
            <button
              onClick={() => { setEditingHoliday(null); setNewHoliday({ date: '', name: '', recurring: false }); }}
              style={{
                padding: '4px 8px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
                cursor: 'pointer', backgroundColor: colors.white, color: colors.gray500,
                fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <X size={13} />
            </button>
          </div>
        </td>
      </tr>
    );

  const renderCalendar = () => (
    <div>
      {/* Page Sub-Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', color: colors.gray400, marginBottom: '4px' }}>
            Admin → Calendar Management
          </div>
          <p style={{ fontSize: '14px', color: colors.gray500, margin: 0 }}>
            Manage public holidays and weekend configuration for working time TAT calculations
          </p>
        </div>
        <button
          onClick={() => {
            if (editingHoliday) return;
            setEditingHoliday('new');
            setNewHoliday({ date: '', name: '', recurring: false });
          }}
          disabled={!!editingHoliday}
          style={{
            padding: '8px 16px',
            backgroundColor: editingHoliday ? colors.gray200 : colors.tealPrimary,
            color: editingHoliday ? colors.gray400 : colors.white,
            border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 500,
            cursor: editingHoliday ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <Plus size={14} /> Add Holiday
        </button>
      </div>

      {/* Weekend Config + Year Filter Row */}
      <div style={{
        backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
        borderRadius: '6px', padding: '16px 20px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginBottom: '4px', display: 'block' }}>Year</label>
            <select value={calendarYear} onChange={e => setCalendarYear(e.target.value)} style={{
              padding: '6px 10px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
              fontSize: '13px', backgroundColor: colors.white,
            }}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
          <div style={{ borderLeft: `1px solid ${colors.gray200}`, paddingLeft: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginBottom: '6px', display: 'block' }}>
              Weekend Days (excluded from Working Time)
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', 
                  color: (day === 'Saturday' && weekendSaturday) || (day === 'Sunday' && weekendSunday) ? colors.tealPrimary : colors.gray500, 
                  cursor: 'pointer', fontWeight: (day === 'Saturday' && weekendSaturday) || (day === 'Sunday' && weekendSunday) ? 600 : 400,
                }}>
                  <input 
                    type="checkbox" 
                    checked={day === 'Saturday' ? weekendSaturday : day === 'Sunday' ? weekendSunday : false}
                    onChange={e => {
                      if (day === 'Saturday') setWeekendSaturday(e.target.checked);
                      if (day === 'Sunday') setWeekendSunday(e.target.checked);
                    }}
                  />
                  {day.substring(0, 3)}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '6px 12px', backgroundColor: colors.white, border: `1px solid ${colors.gray200}`,
            borderRadius: '4px', fontSize: '12px', color: colors.gray600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Upload size={14} /> Import CSV
          </button>
          <button style={{
            padding: '6px 12px', backgroundColor: colors.white, border: `1px solid ${colors.gray200}`,
            borderRadius: '4px', fontSize: '12px', color: colors.gray600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Holiday Table */}
      <div style={{
        backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
        borderRadius: '6px', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}`, width: '160px' }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}` }}>Holiday Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}`, width: '120px' }}>Recurring</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}`, width: '100px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}`, width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Inline add row at top */}
            {isAdding && <InlineRow isNew />}

            {sortedHolidays.map(holiday => {
              const d = new Date(holiday.date + 'T00:00:00');
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const isWeekend = (dayName === 'Sat' && weekendSaturday) || (dayName === 'Sun' && weekendSunday);
              const isEditing = editingId === holiday.id;

              if (isEditing) {
                return <InlineRow key={holiday.id} isNew={false} />;
              }

              return (
                <tr key={holiday.id} style={{
                  borderBottom: `1px solid ${colors.gray100}`,
                  opacity: holiday.active ? 1 : 0.5,
                  transition: 'background-color 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.gray50}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarDays size={14} color={colors.gray400} />
                      <div>
                        <div style={{ fontWeight: 500, color: colors.gray800 }}>{displayDate}</div>
                        <div style={{ fontSize: '11px', color: isWeekend ? colors.orange : colors.gray400 }}>
                          {dayName}{isWeekend ? ' (weekend)' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', color: colors.gray800 }}>{holiday.name}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    {holiday.recurring ? (
                      <Badge variant="teal" size="sm">Annual</Badge>
                    ) : (
                      <Badge variant="default" size="sm">One-time</Badge>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <Badge variant={holiday.active ? 'success' : 'default'} size="sm">
                      {holiday.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <button
                        onClick={() => {
                          if (editingHoliday) return;
                          setEditingHoliday(holiday);
                          setNewHoliday({ date: holiday.date, name: holiday.name, recurring: holiday.recurring });
                        }}
                        disabled={!!editingHoliday}
                        style={{
                          padding: '4px 8px', border: 'none', background: 'none', cursor: editingHoliday ? 'not-allowed' : 'pointer',
                          color: editingHoliday ? colors.gray300 : colors.tealPrimary,
                        }} title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (editingHoliday) return;
                          setHolidays(prev => prev.filter(h => h.id !== holiday.id));
                        }}
                        disabled={!!editingHoliday}
                        style={{
                          padding: '4px 8px', border: 'none', background: 'none', cursor: editingHoliday ? 'not-allowed' : 'pointer',
                          color: editingHoliday ? colors.gray300 : colors.red,
                        }} title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty state */}
            {holidays.length === 0 && !isAdding && (
              <tr>
                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: colors.gray400, fontSize: '13px' }}>
                  No holidays configured for {calendarYear}. Click "Add Holiday" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.gray100}`, fontSize: '12px', color: colors.gray400 }}>
          {holidays.length} holidays configured for {calendarYear}
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER: V2 DASHBOARD (PREVIEW)

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: colors.gray50, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: colors.tealPrimary, padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: colors.white, fontSize: '14px', fontWeight: 600 }}>OpenELIS Global</span>
      </div>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ color: colors.tealPrimary, fontSize: '13px', cursor: 'pointer' }}>Home</span>
          <span style={{ color: colors.gray400, fontSize: '13px' }}>▸ Admin</span>
          <span style={{ color: colors.gray400, fontSize: '13px' }}>▸ Calendar Management</span>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: colors.gray900, margin: '0 0 4px 0' }}>
            Calendar Management
          </h1>
        </div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default CalendarManagement;
