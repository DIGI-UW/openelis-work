/**
 * Informed Consent Capture — OpenELIS Global
 * FRS: informed-consent-frs.md | Version: 1.1 | Date: 2026-04-14
 *
 * Demonstrates the Informed Consent Accordion section as it appears on:
 *   1. The existing Add Order screen (new order, no consent recorded)
 *   2. The existing Edit Order screen (consent previously recorded)
 *
 * Note: The ConsentAccordionSection component is exported for reuse in
 * other workflows (e.g. Sample Collection Wizard) — see OGC-557 comments.
 *
 * Carbon components used: Accordion, AccordionItem, Checkbox, TextInput,
 *   FormGroup, Tag, InlineNotification, Grid, Column, Stack, Tile, Button,
 *   Tabs, Tab, TabList, TabPanels, TabPanel
 */

import React, { useState, useCallback } from 'react';
import {
  Accordion,
  AccordionItem,
  Checkbox,
  TextInput,
  FormGroup,
  Tag,
  InlineNotification,
  Grid,
  Column,
  Stack,
  Tile,
  Button,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Select,
  SelectItem,
  DatePicker,
  DatePickerInput,
} from '@carbon/react';
import { Save, UserAvatar, Time } from '@carbon/icons-react';

// ─── i18n helper ────────────────────────────────────────────────────────────
const t = (key, fallback) => fallback || key;

// ─── Validation ─────────────────────────────────────────────────────────────
const FORM_REF_MAX_LENGTH = 100;
const FORM_REF_PATTERN = /^[a-zA-Z0-9\- ]*$/;

function validateFormRef(value) {
  if (!value) return null;
  if (value.length > FORM_REF_MAX_LENGTH) {
    return t('error.informedConsent.formReferenceMaxLength', 'Consent form reference must be 100 characters or fewer');
  }
  if (!FORM_REF_PATTERN.test(value)) {
    return t('error.informedConsent.formReferenceInvalidChars', 'Only letters, numbers, hyphens, and spaces are allowed');
  }
  return null;
}

// ─── ConsentAccordionSection ─────────────────────────────────────────────────
// Exported reusable component — can be embedded in any order entry surface.
//
// Props:
//   existingConsent  — { given: bool, formReference: string, recordedBy: string, recordedAt: string } | null
//   readOnly         — bool (true when user lacks sampleOrder.modify permission)
export function ConsentAccordionSection({ existingConsent = null, readOnly = false }) {
  const [consentGiven, setConsentGiven] = useState(existingConsent?.given ?? false);
  const [formReference, setFormReference] = useState(existingConsent?.formReference ?? '');
  const [formRefError, setFormRefError] = useState(null);

  const handleConsentChange = useCallback((_, { checked }) => {
    setConsentGiven(checked);
    if (!checked) {
      setFormReference('');
      setFormRefError(null);
    }
  }, []);

  const handleFormRefChange = useCallback((e) => {
    const value = e.target.value;
    setFormReference(value);
    setFormRefError(validateFormRef(value));
  }, []);

  const statusTag = consentGiven ? (
    <Tag kind="teal" size="sm" style={{ marginLeft: 'var(--cds-spacing-03)' }}>
      {t('label.informedConsent.statusTag', 'Consent Recorded')}
    </Tag>
  ) : null;

  return (
    <Accordion>
      <AccordionItem
        title={
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {t('heading.informedConsent.sectionTitle', 'Informed Consent')}
            {statusTag}
          </span>
        }
        open
      >
        <Stack gap={5}>
          <Checkbox
            id="consent-given-checkbox"
            labelText={t('label.informedConsent.consentGiven', 'Patient has provided signed consent')}
            checked={consentGiven}
            onChange={handleConsentChange}
            disabled={readOnly}
          />

          {consentGiven && (
            <TextInput
              id="consent-form-reference"
              labelText={t('label.informedConsent.formReference', 'Consent Form Reference No.')}
              placeholder={t('placeholder.informedConsent.formReference', 'e.g. CF-2026-00123')}
              value={formReference}
              onChange={handleFormRefChange}
              invalid={!!formRefError}
              invalidText={formRefError}
              disabled={readOnly}
              maxLength={FORM_REF_MAX_LENGTH}
              style={{ maxWidth: '400px' }}
            />
          )}

          {/* Audit record — shown when editing an order with previously saved consent */}
          {existingConsent?.given && (
            <Tile style={{ background: 'var(--cds-layer-02)', padding: 'var(--cds-spacing-04)' }}>
              <p style={{
                fontSize: 'var(--cds-label-01-font-size)',
                fontWeight: 'var(--cds-label-01-font-weight)',
                color: 'var(--cds-text-secondary)',
                marginBottom: 'var(--cds-spacing-03)',
              }}>
                {t('heading.informedConsent.auditRecord', 'Consent Audit Record')}
              </p>
              <Stack gap={2}>
                <Stack orientation="horizontal" gap={3}>
                  <UserAvatar size={16} />
                  <span style={{ fontSize: 'var(--cds-body-short-01-font-size)' }}>
                    <strong>{t('label.informedConsent.recordedBy', 'Recorded by')}:</strong>{' '}
                    {existingConsent.recordedBy}
                  </span>
                </Stack>
                <Stack orientation="horizontal" gap={3}>
                  <Time size={16} />
                  <span style={{ fontSize: 'var(--cds-body-short-01-font-size)' }}>
                    <strong>{t('label.informedConsent.recordedAt', 'Recorded on')}:</strong>{' '}
                    {existingConsent.recordedAt}
                  </span>
                </Stack>
              </Stack>
            </Tile>
          )}
        </Stack>
      </AccordionItem>
    </Accordion>
  );
}

// ─── Scenario 1: Add Order screen (new order, no existing consent) ───────────
function AddOrderScreen() {
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <h4 style={{ marginBottom: 'var(--cds-spacing-05)', color: 'var(--cds-text-primary)' }}>
        {t('heading.addOrder', 'Add Order')}
      </h4>

      {saved && (
        <InlineNotification
          kind="success"
          title={t('message.order.saveSuccess', 'Order saved successfully.')}
          onCloseButtonClick={() => setSaved(false)}
          style={{ marginBottom: 'var(--cds-spacing-05)' }}
        />
      )}

      <Stack gap={6}>
        <Tile>
          <p style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
            {t('heading.patientInfo', 'Patient Information')}
          </p>
          <Grid>
            <Column lg={6} md={4}>
              <TextInput id="patient-id" labelText={t('label.patientId', 'Patient ID')} placeholder="e.g. P-00456" />
            </Column>
            <Column lg={6} md={4}>
              <TextInput id="patient-name" labelText={t('label.patientName', 'Full Name')} placeholder="e.g. Rakoto Andriamanana" />
            </Column>
          </Grid>
        </Tile>

        <Tile>
          <p style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
            {t('heading.orderInfo', 'Order Information')}
          </p>
          <Grid>
            <Column lg={6} md={4}>
              <Select id="lab-section" labelText={t('label.labSection', 'Lab Section')}>
                <SelectItem value="" text={t('placeholder.select', 'Select section')} />
                <SelectItem value="hematology" text="Hematology" />
                <SelectItem value="microbiology" text="Microbiology" />
                <SelectItem value="chemistry" text="Chemistry" />
                <SelectItem value="serology" text="Serology" />
              </Select>
            </Column>
            <Column lg={6} md={4}>
              <DatePicker datePickerType="single">
                <DatePickerInput
                  id="collection-date"
                  labelText={t('label.collectionDate', 'Collection Date')}
                  placeholder="DD/MM/YYYY"
                />
              </DatePicker>
            </Column>
          </Grid>
        </Tile>

        {/* ★ Informed Consent */}
        <ConsentAccordionSection existingConsent={null} readOnly={false} />

        <Stack orientation="horizontal" gap={3}>
          <Button kind="primary" renderIcon={Save} onClick={() => setSaved(true)}>
            {t('button.order.save', 'Save Order')}
          </Button>
          <Button kind="ghost">
            {t('button.order.cancel', 'Cancel')}
          </Button>
        </Stack>
      </Stack>
    </div>
  );
}

// ─── Scenario 2: Edit Order with previously recorded consent ─────────────────
function EditOrderScreen() {
  const existingConsent = {
    given: true,
    formReference: 'CF-2026-00847',
    recordedBy: 'Marie Rakoto',
    recordedAt: '14 Apr 2026, 09:32 UTC',
  };

  return (
    <div>
      <h4 style={{ marginBottom: 'var(--cds-spacing-05)', color: 'var(--cds-text-primary)' }}>
        {t('heading.editOrder', 'Edit Order')} — #ORD-2026-00847
      </h4>

      <Stack gap={6}>
        <Tile>
          <p style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
            {t('heading.patientInfo', 'Patient Information')}
          </p>
          <Grid>
            <Column lg={6} md={4}>
              <TextInput id="edit-patient-id" labelText={t('label.patientId', 'Patient ID')} value="P-00456" readOnly />
            </Column>
            <Column lg={6} md={4}>
              <TextInput id="edit-patient-name" labelText={t('label.patientName', 'Full Name')} value="Rakoto Andriamanana" readOnly />
            </Column>
          </Grid>
        </Tile>

        {/* ★ Consent pre-populated with audit record */}
        <ConsentAccordionSection existingConsent={existingConsent} readOnly={false} />

        <Stack orientation="horizontal" gap={3}>
          <Button kind="primary" renderIcon={Save}>
            {t('button.order.save', 'Save Order')}
          </Button>
          <Button kind="ghost">
            {t('button.order.cancel', 'Cancel')}
          </Button>
        </Stack>
      </Stack>
    </div>
  );
}

// ─── Root component ──────────────────────────────────────────────────────────
export default function InformedConsentMockup() {
  return (
    <div style={{ padding: 'var(--cds-spacing-07)', maxWidth: '960px', margin: '0 auto' }}>
      <Stack gap={5}>
        <div>
          <h2 style={{ marginBottom: 'var(--cds-spacing-02)' }}>
            {t('heading.mockupTitle', 'Informed Consent Capture — Design Mockup')}
          </h2>
          <p style={{ color: 'var(--cds-text-secondary)', fontSize: 'var(--cds-body-short-01-font-size)' }}>
            {t('label.mockupSubtitle', 'FRS: informed-consent-frs.md | v1.1 | 2026-04-14')}
          </p>
        </div>

        <Tabs>
          <TabList aria-label={t('label.scenarioTabs', 'Design scenarios')}>
            <Tab>{t('label.tab.addOrder', 'Add Order (New)')}</Tab>
            <Tab>{t('label.tab.editOrder', 'Edit Order (Consent Recorded)')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel><Tile style={{ marginTop: 'var(--cds-spacing-05)' }}><AddOrderScreen /></Tile></TabPanel>
            <TabPanel><Tile style={{ marginTop: 'var(--cds-spacing-05)' }}><EditOrderScreen /></Tile></TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </div>
  );
}
