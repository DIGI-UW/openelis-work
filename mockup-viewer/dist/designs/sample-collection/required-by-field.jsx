/**
 * GENERIC — Required-By Date Field on Order Entry Step 1
 * Cross-cutting OE feature (NOT part of OGC-527 / Env epic)
 *
 * 2 scenes:
 *  1. Step 1 Order Entry (any domain) — Required By DatePicker + TimePicker pair
 *  2. Lab Unit Admin — per-domain "Required" flag for the field
 *
 * Annotation convention:
 *   Gold dashed border + "GENERIC NEW" badge = new content
 *   Dimmed (72% opacity) + "EXISTING" badge   = surrounding context for placement
 */

import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  TextInput, Select, SelectItem, Toggle,
  Tile, Tag, Button,
  DatePicker, DatePickerInput, TimePicker,
  Tabs, Tab, TabList, TabPanels, TabPanel,
} from '@carbon/react';
import { Calendar, Time, Save } from '@carbon/icons-react';

const t = (k, f) => f || k;

const NewRegion = ({ children, label = 'GENERIC NEW' }) => (
  <div style={{ border: '2px dashed #F1C21B', borderRadius: 6, padding: 12, position: 'relative', marginBottom: 16 }}>
    <span style={{
      position: 'absolute', top: -11, left: 12,
      background: '#F1C21B', color: '#000', fontSize: 11, fontWeight: 700,
      padding: '1px 8px', borderRadius: 4, letterSpacing: '0.04em',
    }}>{label}</span>
    {children}
  </div>
);

const ExistingRegion = ({ children, label = 'EXISTING' }) => (
  <div style={{ opacity: 0.72, position: 'relative', marginBottom: 16 }}>
    <span style={{
      position: 'absolute', top: 4, right: 8, zIndex: 1,
      background: '#8D8D8D', color: '#fff', fontSize: 10, fontWeight: 600,
      padding: '1px 6px', borderRadius: 3,
    }}>{label}</span>
    {children}
  </div>
);

export default function RequiredByFieldMockup() {
  const [scene, setScene] = useState(0);

  // Scene 1 state
  const [requiredByDate, setRequiredByDate] = useState('');
  const [requiredByTime, setRequiredByTime] = useState('');

  // Scene 2 state
  const [config, setConfig] = useState({ Clinical: false, Env: true, Vector: true, EQA: true });

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Tabs selectedIndex={scene} onChange={({ selectedIndex }) => setScene(selectedIndex)}>
        <TabList aria-label="Scene">
          <Tab>Step 1 — Order Entry</Tab>
          <Tab>Admin — Lab Unit Config</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Order Entry — Step 1 (any domain)</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The new Required-By field appears in Step 1 for clinical, env, vector, and EQA orders.
              Optional by default; required when the lab-unit config flag is set for the order's domain.
            </p>

            <ExistingRegion>
              <Tile>
                <Grid>
                  <Column lg={4}>
                    <TextInput id="lab-no" labelText={t('label.labNo', 'Lab Number')} value="ORD-2026-0428" readOnly />
                  </Column>
                  <Column lg={4}>
                    <Select id="priority" labelText={t('label.priority', 'Priority')}>
                      <SelectItem value="routine" text="Routine" />
                      <SelectItem value="urgent" text="Urgent" />
                      <SelectItem value="stat" text="STAT" />
                    </Select>
                  </Column>
                </Grid>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>{t('heading.requiredBy', 'Required By')}</h5>
                <Grid>
                  <Column lg={5}>
                    <DatePicker
                      datePickerType="single"
                      onChange={([d]) => setRequiredByDate(d?.toISOString().slice(0, 10) || '')}
                    >
                      <DatePickerInput
                        id="req-by-date"
                        labelText={t('label.requiredBy.date', 'Required-by date')}
                        placeholder="yyyy-mm-dd"
                      />
                    </DatePicker>
                  </Column>
                  <Column lg={3}>
                    <TimePicker
                      id="req-by-time"
                      labelText={t('label.requiredBy.time', 'Time')}
                      placeholder="hh:mm"
                      value={requiredByTime}
                      onChange={(e) => setRequiredByTime(e.target.value)}
                    />
                  </Column>
                  <Column lg={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <p style={{ fontSize: 12, color: '#525252' }}>
                      {t('helper.requiredBy', 'Optional. Required if your lab unit configures it for this domain.')}
                    </p>
                  </Column>
                </Grid>
              </Tile>
            </NewRegion>

            <ExistingRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
                  <Button kind="ghost">{t('button.cancel', 'Cancel')}</Button>
                  <Button kind="secondary" renderIcon={Save}>{t('button.saveDraft', 'Save Draft')}</Button>
                  <Button kind="primary">{t('button.continue', 'Continue')}</Button>
                </Stack>
              </Tile>
            </ExistingRegion>
          </TabPanel>

          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Lab Unit Admin — Per-domain "Required" config</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              Lab admins decide whether Required-By is mandatory per domain. Optional by default; toggle on to enforce.
            </p>

            <ExistingRegion>
              <Tile>
                <h5>{t('heading.labUnit', 'Lab Unit — Env Lab Jakarta')}</h5>
                <Grid style={{ marginTop: 12 }}>
                  <Column lg={4}><TextInput id="lab-name" labelText="Name" value="Env Lab Jakarta" readOnly /></Column>
                  <Column lg={4}><TextInput id="lab-domain" labelText="Domain Assignment" value="Environmental" readOnly /></Column>
                </Grid>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>{t('heading.requiredByConfig', 'Required-By Field — Per-Domain Required Flag')}</h5>
                <p style={{ fontSize: 12, color: '#525252', marginBottom: 16 }}>
                  When toggled on, orders of that domain cannot submit Step 1 without a Required-By date entered.
                </p>
                <Grid>
                  {['Clinical', 'Env', 'Vector', 'EQA'].map(d => (
                    <Column lg={3} md={4} sm={2} key={d}>
                      <Toggle
                        id={`req-${d}`}
                        labelText={d}
                        labelA="Optional"
                        labelB="Required"
                        toggled={config[d]}
                        onToggle={() => setConfig(prev => ({ ...prev, [d]: !prev[d] }))}
                      />
                    </Column>
                  ))}
                </Grid>
              </Tile>
            </NewRegion>

            <ExistingRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
                  <Button kind="ghost">{t('button.cancel', 'Cancel')}</Button>
                  <Button kind="primary" renderIcon={Save}>{t('button.save', 'Save')}</Button>
                </Stack>
              </Tile>
            </ExistingRegion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
