// Navigation Redesign: main menu + Admin sidebar (developer-handoff mockup)
// FRS: navigation-redesign-frs.md v0.1 (approved 2026-09-24) · Preview: navigation-redesign-preview.html
// Routes: every page keeps its current route. Admin pages stay at /MasterListsPage/<editorKey>.
// SideNav: main menu = sections D-064; Admin replaces the main menu in the same panel (FR-22).
//
// How to read this file
// - MENU mirrors the target clinlims.menu tree (element IDs, i18n keys, routes, icons) that the
//   migration must produce. In the app the tree comes from /rest/menu and is rendered by the
//   EXISTING ConfiguredSideNav (#4315). Reuse it; do not re-implement it. This file renders the
//   same tree only so the handoff is self-contained. The additions this feature makes to that
//   renderer are: the 21 new icon keys in navigationIcons.js, and hiding empty sections/groups (FR-17).
// - ADMIN is the target grouping for AdminSideNav.jsx (or its OGC-529 successor).
// - Role, lab-unit and domain filtering (OGC-1151, OGC-1070) are EXISTING behavior, not drawn here.

import React, { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Link, useLocation } from "react-router-dom";
import {
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavLink, SideNavDivider,
} from "@carbon/react";
import {
  Home, Notification, DocumentAdd, UserMultiple, Catalog, Box, TestTool, InventoryManagement,
  Task, Chemistry, CheckmarkOutline, Microscope, Chip, Notebook, Dashboard, ChartLineData,
  Certificate, Meter, WarningAlt, Policy, Report, DocumentMultiple_01, DataTable, Time, Export,
  Earth, Bee, Settings, Purchase, Help, ArrowLeft, Launch,
} from "@carbon/icons-react";

// Proposed navigationIcons.js registry (FRS Icon table). Existing keys kept; 21 added.
export const navigationIcons = {
  home: Home, alerts: Notification, order: DocumentAdd, patient: UserMultiple, sample: Catalog,
  storage: Box, aliquot: TestTool, inventory: InventoryManagement, workplan: Task,
  results: Chemistry, validation: CheckmarkOutline, specialty: Microscope, analyzers: Chip,
  notebook: Notebook, qaOverview: Dashboard, qc: ChartLineData, eqa: Certificate, qi: Meter,
  nce: WarningAlt, qms: Policy, statusReport: Report, routineReports: DocumentMultiple_01,
  customExport: DataTable, tat: Time, whonet: Export, environmental: Earth, vector: Bee,
  settings: Settings, billing: Purchase, help: Help,
  reports: Report, // kept for deployment profiles
};

// Target main-menu tree. `label` is the English fallback for `displayKey`.
// newRow: true = row the migration inserts. legacyResults: true = shown only when
// RESULTS_ENTRY_UNIFIED_ROUTE is not "true" (existing flag, unchanged).
export const MENU = [
  {
    "elementId": "menu_home",
    "displayKey": "banner.menu.home",
    "label": "Home",
    "actionURL": "/Dashboard",
    "icon": "home"
  },
  {
    "elementId": "menu_alerts_standalone",
    "displayKey": "banner.menu.alerts",
    "label": "Alerts",
    "actionURL": "/Alerts",
    "icon": "alerts"
  },
  {
    "elementId": "menu_section_orders",
    "displayKey": "sidenav.section.patientOrders",
    "label": "Orders & Patients",
    "presentationStyle": "section",
    "newRow": true,
    "childMenus": [
      {
        "elementId": "menu_sample",
        "displayKey": "sidenav.label.orders",
        "label": "Orders",
        "icon": "order",
        "childMenus": [
          {
            "elementId": "menu_clinical_workflow",
            "displayKey": "sidenav.label.orders.clinical",
            "label": "Clinical",
            "childMenus": [
              {
                "elementId": "menu_clinical_dashboard",
                "displayKey": "sidenav.label.order.dashboard",
                "label": "Dashboard",
                "actionURL": "/order/clinical"
              },
              {
                "elementId": "menu_clinical_enter",
                "displayKey": "sidenav.label.order.enter",
                "label": "Enter Order",
                "actionURL": "/order/clinical/enter"
              },
              {
                "elementId": "menu_clinical_collect",
                "displayKey": "sidenav.label.order.collect",
                "label": "Collect Sample",
                "actionURL": "/order/clinical/collect"
              },
              {
                "elementId": "menu_clinical_label",
                "displayKey": "sidenav.label.order.label",
                "label": "Label & Store",
                "actionURL": "/order/clinical/label"
              },
              {
                "elementId": "menu_clinical_qa",
                "displayKey": "sidenav.label.order.qa",
                "label": "QA Review",
                "actionURL": "/order/clinical/qa"
              }
            ]
          },
          {
            "elementId": "menu_environmental_workflow",
            "displayKey": "sidenav.label.orders.environmental",
            "label": "Environmental",
            "childMenus": [
              {
                "elementId": "menu_environmental_dashboard",
                "displayKey": "sidenav.label.order.dashboard",
                "label": "Dashboard",
                "actionURL": "/order/environmental"
              },
              {
                "elementId": "menu_environmental_enter",
                "displayKey": "sidenav.label.order.enter",
                "label": "Enter Order",
                "actionURL": "/order/environmental/enter"
              },
              {
                "elementId": "menu_environmental_label",
                "displayKey": "sidenav.label.order.label",
                "label": "Label & Store",
                "actionURL": "/order/environmental/label"
              },
              {
                "elementId": "menu_environmental_qa",
                "displayKey": "sidenav.label.order.qa",
                "label": "QA Review",
                "actionURL": "/order/environmental/qa"
              }
            ]
          },
          {
            "elementId": "menu_vector_workflow",
            "displayKey": "sidenav.label.orders.vector",
            "label": "Vector",
            "childMenus": [
              {
                "elementId": "menu_vector_dashboard",
                "displayKey": "sidenav.label.order.dashboard",
                "label": "Dashboard",
                "actionURL": "/order/vector"
              },
              {
                "elementId": "menu_vector_enter",
                "displayKey": "sidenav.label.order.enter",
                "label": "Enter Order",
                "actionURL": "/order/vector/enter"
              },
              {
                "elementId": "menu_vector_label",
                "displayKey": "sidenav.label.order.label",
                "label": "Label & Store",
                "actionURL": "/order/vector/label"
              },
              {
                "elementId": "menu_vector_qa",
                "displayKey": "sidenav.label.order.qa",
                "label": "QA Review",
                "actionURL": "/order/vector/qa"
              }
            ]
          },
          {
            "elementId": "menu_sample_edit",
            "displayKey": "banner.menu.sampleEdit",
            "label": "Edit Order",
            "actionURL": "/SampleEdit?type=readwrite"
          },
          {
            "elementId": "menu_sample_eorder",
            "displayKey": "banner.menu.eorders",
            "label": "Incoming Orders",
            "actionURL": "/ElectronicOrders"
          },
          {
            "elementId": "menu_sample_batch_entry",
            "displayKey": "banner.menu.sampleBatchEntry",
            "label": "Batch Order Entry",
            "actionURL": "/SampleBatchEntrySetup"
          },
          {
            "elementId": "menu_sample_print_barcode",
            "displayKey": "sidenav.label.orders.printBarcodes",
            "label": "Print Barcodes",
            "actionURL": "/PrintBarcode"
          },
          {
            "elementId": "menu_referrals",
            "displayKey": "sidenav.label.referrals",
            "label": "Referrals",
            "newRow": true,
            "childMenus": [
              {
                "elementId": "menu_sample_shipment",
                "displayKey": "sidenav.label.referrals.shipments",
                "label": "Sample Shipments",
                "actionURL": "/SampleShipment"
              },
              {
                "elementId": "menu_results_referred",
                "displayKey": "sidenav.label.referrals.results",
                "label": "Referral Results",
                "actionURL": "/SampleShipment/reference-lab-results"
              }
            ]
          }
        ]
      },
      {
        "elementId": "menu_patient",
        "displayKey": "sidenav.label.patients",
        "label": "Patients",
        "icon": "patient",
        "childMenus": [
          {
            "elementId": "menu_patient_add_or_edit",
            "displayKey": "banner.menu.patient.addOrEdit",
            "label": "Add/Edit Patient",
            "actionURL": "/PatientManagement"
          },
          {
            "elementId": "menu_patienthistory",
            "displayKey": "banner.menu.patienthistory",
            "label": "Patient History",
            "actionURL": "/PatientHistory"
          },
          {
            "elementId": "menu_patient_merge",
            "displayKey": "sidenav.label.patients.merge",
            "label": "Merge Patients",
            "actionURL": "/PatientMerge"
          }
        ]
      }
    ]
  },
  {
    "elementId": "menu_section_samples",
    "displayKey": "sidenav.section.samples",
    "label": "Samples & Supplies",
    "presentationStyle": "section",
    "newRow": true,
    "childMenus": [
      {
        "elementId": "menu_sample_management",
        "displayKey": "banner.menu.sampleManagement",
        "label": "Sample Management",
        "actionURL": "/SampleManagement",
        "icon": "sample"
      },
      {
        "elementId": "menu_storage",
        "displayKey": "banner.menu.storage",
        "label": "Storage",
        "icon": "storage",
        "childMenus": [
          {
            "elementId": "menu_storage_management",
            "displayKey": "sidenav.label.storage.samples",
            "label": "Sample Storage",
            "actionURL": "/Storage"
          },
          {
            "elementId": "menu_freezer_monitoring",
            "displayKey": "sidenav.label.storage.coldstorage",
            "label": "Cold Storage Monitoring",
            "childMenus": [
              {
                "elementId": "menu_freezer_dashboard",
                "displayKey": "freezer.nav.dashboard",
                "label": "Dashboard",
                "actionURL": "/FreezerMonitoring?tab=0"
              },
              {
                "elementId": "menu_freezer_corrective",
                "displayKey": "freezer.nav.corrective",
                "label": "Corrective Actions",
                "actionURL": "/FreezerMonitoring?tab=1"
              },
              {
                "elementId": "menu_freezer_trends",
                "displayKey": "freezer.nav.trends",
                "label": "Historical Trends",
                "actionURL": "/FreezerMonitoring?tab=2"
              },
              {
                "elementId": "menu_freezer_reports",
                "displayKey": "freezer.nav.reports",
                "label": "Reports",
                "actionURL": "/FreezerMonitoring?tab=3"
              },
              {
                "elementId": "menu_freezer_settings",
                "displayKey": "freezer.nav.settings",
                "label": "Settings",
                "actionURL": "/FreezerMonitoring?tab=4"
              }
            ]
          }
        ]
      },
      {
        "elementId": "menu_aliquot",
        "displayKey": "sidenav.label.aliquoting",
        "label": "Aliquoting",
        "actionURL": "/Aliquot",
        "icon": "aliquot"
      },
      {
        "elementId": "menu_inventory",
        "displayKey": "sidenav.label.inventory",
        "label": "Inventory",
        "actionURL": "/inventory",
        "icon": "inventory"
      }
    ]
  },
  {
    "elementId": "menu_section_testing",
    "displayKey": "sidenav.section.testing",
    "label": "Testing",
    "presentationStyle": "section",
    "newRow": true,
    "childMenus": [
      {
        "elementId": "menu_workplan",
        "displayKey": "banner.menu.workplan",
        "label": "Workplan",
        "icon": "workplan",
        "childMenus": [
          {
            "elementId": "menu_workplan_batch",
            "displayKey": "banner.menu.workplan.batch",
            "label": "Batch Workplan",
            "actionURL": "/Workplan"
          },
          {
            "elementId": "menu_workplan_test",
            "displayKey": "banner.menu.workplan.test",
            "label": "By Test Type",
            "actionURL": "/WorkPlanByTest?type=test"
          },
          {
            "elementId": "menu_workplan_panel",
            "displayKey": "banner.menu.workplan.panel",
            "label": "By Panel",
            "actionURL": "/WorkPlanByPanel?type=panel"
          },
          {
            "elementId": "menu_workplan_bench",
            "displayKey": "sidenav.label.workplan.byLabUnit",
            "label": "By Lab Unit",
            "actionURL": "/WorkPlanByTestSection?type="
          },
          {
            "elementId": "menu_workplan_priority",
            "displayKey": "banner.menu.workplan.priority",
            "label": "By Priority",
            "actionURL": "/WorkPlanByPriority?type=priority"
          }
        ]
      },
      {
        "elementId": "menu_results",
        "displayKey": "banner.menu.results",
        "label": "Results",
        "icon": "results",
        "childMenus": [
          {
            "elementId": "menu_results_unified",
            "displayKey": "banner.menu.results.unified",
            "label": "Results Entry",
            "actionURL": "/Results"
          },
          {
            "elementId": "menu_results_logbook",
            "displayKey": "banner.menu.results.logbook",
            "label": "By Unit",
            "actionURL": "/LogbookResults?type=",
            "legacyResults": true
          },
          {
            "elementId": "menu_results_patient",
            "displayKey": "banner.menu.results.patient",
            "label": "By Patient",
            "actionURL": "/PatientResults",
            "legacyResults": true
          },
          {
            "elementId": "menu_results_accession",
            "displayKey": "banner.menu.results.accession",
            "label": "By Order",
            "actionURL": "/AccessionResults",
            "legacyResults": true
          },
          {
            "elementId": "menu_results_range",
            "displayKey": "menu.results.range",
            "label": "By Range of Order numbers",
            "actionURL": "/RangeResults",
            "legacyResults": true
          },
          {
            "elementId": "menu_results_status",
            "displayKey": "banner.menu.results.status",
            "label": "By Test, Date or Status",
            "actionURL": "/StatusResults?blank=true",
            "legacyResults": true
          },
          {
            "elementId": "menu_vector_identification",
            "displayKey": "sideNav.title.vectorIdentification",
            "label": "Vector Identification",
            "actionURL": "/vector/identification"
          }
        ]
      },
      {
        "elementId": "menu_resultvalidation",
        "displayKey": "banner.menu.resultvalidation",
        "label": "Validation",
        "icon": "validation",
        "childMenus": [
          {
            "elementId": "menu_resultvalidation_routine",
            "displayKey": "banner.menu.resultvalidation_routine",
            "label": "Routine",
            "actionURL": "/ResultValidation?type=&test="
          },
          {
            "elementId": "menu_accession_validation",
            "displayKey": "menu.accession.validation",
            "label": "By Order",
            "actionURL": "/AccessionValidation"
          },
          {
            "elementId": "menu_accession_validation_range",
            "displayKey": "menu.accession.validation.range",
            "label": "By Range of Order Numbers",
            "actionURL": "/AccessionValidationRange"
          },
          {
            "elementId": "menu_resultvalidation_date",
            "displayKey": "menu.validation.date",
            "label": "By Date",
            "actionURL": "/ResultValidationByTestDate"
          }
        ]
      },
      {
        "elementId": "menu_specialty",
        "displayKey": "sidenav.label.caseWorkbenches",
        "label": "Case Workbenches",
        "icon": "specialty",
        "newRow": true,
        "childMenus": [
          {
            "elementId": "menu_microbiology",
            "displayKey": "sidenav.label.microbiology",
            "label": "Microbiology",
            "actionURL": "/Microbiology/worklist"
          },
          {
            "elementId": "menu_pathology",
            "displayKey": "sidenav.label.pathology",
            "label": "Pathology",
            "actionURL": "/PathologyDashboard"
          },
          {
            "elementId": "menu_immunochem",
            "displayKey": "sidenav.label.immunochem",
            "label": "Immunohistochemistry",
            "actionURL": "/ImmunohistochemistryDashboard"
          },
          {
            "elementId": "menu_cytology",
            "displayKey": "sidenav.label.cytology",
            "label": "Cytology",
            "actionURL": "/CytologyDashboard"
          },
          {
            "elementId": "order_programmes",
            "displayKey": "sidenav.label.programCases",
            "label": "Program Cases",
            "actionURL": "/genericProgram"
          }
        ]
      },
      {
        "elementId": "menu_analyzers",
        "displayKey": "analyzer.navigation.analyzers",
        "label": "Analyzers",
        "icon": "analyzers",
        "childMenus": [
          {
            "elementId": "menu_analyzers_list",
            "displayKey": "sidenav.label.analyzers.list",
            "label": "Analyzers",
            "actionURL": "/analyzers"
          },
          {
            "elementId": "menu_analyzers_types",
            "displayKey": "analyzer.navigation.analyzerTypes",
            "label": "Analyzer Types",
            "actionURL": "/analyzers/types"
          },
          {
            "elementId": "menu_administration_stuck_analyzer_events",
            "displayKey": "sidenav.label.analyzers.importIssues",
            "label": "Import Issues",
            "actionURL": "/AnalyzerResults?view=import-issues"
          }
        ]
      },
      {
        "elementId": "menu_notebook",
        "displayKey": "sidenav.label.notebook",
        "label": "Lab Notebook",
        "actionURL": "/NotebookDashboard",
        "icon": "notebook"
      }
    ]
  },
  {
    "elementId": "menu_qa",
    "displayKey": "sidenav.section.quality",
    "label": "Quality",
    "presentationStyle": "section",
    "childMenus": [
      {
        "elementId": "menu_qa_overview",
        "displayKey": "sideNav.label.qa.overview",
        "label": "QA Overview",
        "actionURL": "/qa/overview",
        "icon": "qaOverview"
      },
      {
        "elementId": "menu_qa_qc",
        "displayKey": "sidenav.label.qa.qualityControl",
        "label": "Quality Control",
        "icon": "qc",
        "childMenus": [
          {
            "elementId": "menu_qa_qc_dashboard",
            "displayKey": "sideNav.label.qa.qc.dashboard",
            "label": "QC Dashboard",
            "actionURL": "/qa/qc/dashboard"
          },
          {
            "elementId": "menu_qa_qc_alerts",
            "displayKey": "sideNav.label.qa.qc.alerts",
            "label": "QC Alerts",
            "actionURL": "/qa/qc/alerts"
          },
          {
            "elementId": "menu_qa_qc_control_lots",
            "displayKey": "sideNav.label.qa.qc.controlLots",
            "label": "QC Lot Management",
            "actionURL": "/qa/qc/control-lots"
          },
          {
            "elementId": "menu_qa_qc_rule_config",
            "displayKey": "sideNav.label.qa.qc.ruleConfig",
            "label": "Rule Configuration",
            "actionURL": "/qa/qc/rule-config"
          },
          {
            "elementId": "menu_qa_qc_reagent_qc",
            "displayKey": "sideNav.label.qa.qc.reagentQc",
            "label": "Reagent QC",
            "actionURL": "/qa/qc/reagent-qc"
          },
          {
            "elementId": "menu_qa_qc_manual_qc",
            "displayKey": "sideNav.label.qa.qc.manualQc",
            "label": "Analyzer Manual QC",
            "actionURL": "/qa/qc/manual-qc"
          }
        ]
      },
      {
        "elementId": "menu_eqa",
        "displayKey": "banner.menu.eqa",
        "label": "EQA",
        "icon": "eqa",
        "childMenus": [
          {
            "elementId": "menu_eqa_orders",
            "displayKey": "sidenav.label.eqa.orders",
            "label": "EQA Orders",
            "actionURL": "/qa/eqa/orders"
          },
          {
            "elementId": "menu_eqa_my_programs",
            "displayKey": "banner.menu.eqa.tests.myPrograms",
            "label": "My Programs",
            "actionURL": "/qa/eqa/my-programs"
          },
          {
            "elementId": "menu_eqa_mgmt_programs",
            "displayKey": "sidenav.label.eqa.programManagement",
            "label": "Program Management",
            "actionURL": "/qa/eqa/management"
          },
          {
            "elementId": "menu_eqa_mgmt_participants",
            "displayKey": "banner.menu.eqa.mgmt.participants",
            "label": "Participants",
            "actionURL": "/qa/eqa/participants"
          },
          {
            "elementId": "menu_eqa_mgmt_distributions",
            "displayKey": "banner.menu.eqa.mgmt.distributions",
            "label": "Distributions",
            "actionURL": "/qa/eqa/distribution"
          },
          {
            "elementId": "menu_eqa_mgmt_results",
            "displayKey": "banner.menu.eqa.mgmt.results",
            "label": "Results & Analysis",
            "actionURL": "/qa/eqa/results"
          }
        ]
      },
      {
        "elementId": "menu_qa_qi",
        "displayKey": "sideNav.label.qa.qi",
        "label": "Quality Indicators",
        "icon": "qi",
        "childMenus": [
          {
            "elementId": "menu_qa_qi_dashboard",
            "displayKey": "sideNav.label.qa.qi.dashboard",
            "label": "QI Dashboard",
            "actionURL": "/qa/qi/dashboard"
          },
          {
            "elementId": "menu_qa_qi_config",
            "displayKey": "sideNav.label.qa.qi.config",
            "label": "QI Configuration",
            "actionURL": "/qa/qi/config"
          }
        ]
      },
      {
        "elementId": "menu_nonconformity",
        "displayKey": "sidenav.label.nce.group",
        "label": "Non-Conformity & CAPA",
        "icon": "nce",
        "childMenus": [
          {
            "elementId": "menu_nce_dashboard",
            "displayKey": "banner.menu.nonconformity.dashboard",
            "label": "All NCEs",
            "actionURL": "/NceDashboard"
          },
          {
            "elementId": "menu_non_conforming_report",
            "displayKey": "banner.menu.nonconformity.report",
            "label": "Report Non-Conforming Event",
            "actionURL": "/ReportNonConformingEvent"
          },
          {
            "elementId": "menu_non_conforming_view",
            "displayKey": "banner.menu.nonconformity.view",
            "label": "View New Non-Conforming Events",
            "actionURL": "/ViewNonConformingEvent"
          },
          {
            "elementId": "menu_non_conforming_corrective_actions",
            "displayKey": "banner.menu.nonconformity.correctiveActions",
            "label": "Corrective actions",
            "actionURL": "/NCECorrectiveAction"
          },
          {
            "elementId": "menu_qa_qms_capa_register",
            "displayKey": "sideNav.label.qa.qms.capaRegister",
            "label": "CAPA Register",
            "actionURL": "/qa/qms/capa-register"
          }
        ]
      },
      {
        "elementId": "menu_qa_qms",
        "displayKey": "sideNav.label.qa.qms",
        "label": "QMS & Improvement",
        "icon": "qms",
        "childMenus": [
          {
            "elementId": "menu_reports_audittrail_system",
            "displayKey": "sidenav.label.audit.system",
            "label": "Audit Trail: System Events",
            "actionURL": "/AuditTrailReport?type=system"
          },
          {
            "elementId": "menu_reports_audittrail_order",
            "displayKey": "sidenav.label.audit.order",
            "label": "Audit Trail: Order Events",
            "actionURL": "/AuditTrailReport?type=order"
          },
          {
            "elementId": "menu_qa_qms_esig_log",
            "displayKey": "sideNav.label.qa.qms.esigLog",
            "label": "Electronic Signature Log",
            "actionURL": "/qa/qms/e-signature-log"
          },
          {
            "elementId": "menu_qa_qms_accreditation",
            "displayKey": "sideNav.label.qa.qms.accreditation",
            "label": "Accreditation",
            "actionURL": "/qa/qms/accreditation"
          }
        ]
      }
    ]
  },
  {
    "elementId": "menu_reports",
    "displayKey": "sidenav.label.reports",
    "label": "Reports",
    "presentationStyle": "section",
    "childMenus": [
      {
        "elementId": "menu_reports_status_patient",
        "displayKey": "openreports.patientTestStatus",
        "label": "Patient Status Report",
        "actionURL": "/Report?type=patient&report=patientCILNSP_vreduit",
        "icon": "reports"
      },
      {
        "elementId": "menu_reports_routine",
        "displayKey": "banner.menu.reports.routine",
        "label": "Routine",
        "actionURL": "/RoutineReports",
        "icon": "reports"
      },
      {
        "elementId": "menu_reports_custom_data_export",
        "displayKey": "reporting.title",
        "label": "Custom Data Export",
        "actionURL": "/CustomDataExport",
        "icon": "reports"
      },
      {
        "elementId": "menu_reports_tatreport",
        "displayKey": "sideNav.title.tatreport",
        "label": "Turn Around Time",
        "actionURL": "/TATReport",
        "icon": "reports"
      },
      {
        "elementId": "menu_microbiology_whonet",
        "displayKey": "sidenav.label.reports.whonet",
        "label": "WHONET Export",
        "actionURL": "/Microbiology/whonet",
        "icon": "reports"
      },
      {
        "elementId": "menu_reports_environmental",
        "displayKey": "sidenav.label.reports.environmental",
        "label": "Environmental",
        "icon": "reports",
        "childMenus": [
          {
            "elementId": "menu_environmental_compliance",
            "displayKey": "sidenav.label.environmental.compliance",
            "label": "Compliance Dashboard",
            "actionURL": "/EnvironmentalDashboard"
          },
          {
            "elementId": "menu_reports_environmental_laporanhasil",
            "displayKey": "sideNav.label.laporanHasil",
            "label": "Compliance Report",
            "actionURL": "/LaporanHasil"
          }
        ]
      },
      {
        "elementId": "menu_reports_vectorsurveillance",
        "displayKey": "vectorReport.title",
        "label": "Vector Surveillance",
        "actionURL": "/VectorSurveillanceReport",
        "icon": "reports"
      }
    ]
  },
  {
    "elementId": "menu_section_admin",
    "displayKey": "sidenav.section.administration",
    "label": "Administration",
    "presentationStyle": "section",
    "newRow": true,
    "childMenus": [
      {
        "elementId": "menu_administration",
        "displayKey": "banner.menu.administration",
        "label": "Admin",
        "actionURL": "/MasterListsPage",
        "icon": "settings"
      },
      {
        "elementId": "menu_billing",
        "displayKey": "banner.menu.billing",
        "label": "Billing",
        "icon": "billing"
      },
      {
        "elementId": "menu_help",
        "displayKey": "banner.menu.help",
        "label": "Help",
        "icon": "help",
        "childMenus": [
          {
            "elementId": "menu_help_user_manual",
            "displayKey": "banner.menu.help.usermanual",
            "label": "User Manual",
            "actionURL": "/docs/UserManual"
          }
        ]
      }
    ]
  }
];

// Target Admin sidebar grouping (D-010 buckets). Every page keeps /MasterListsPage/<editorKey>.
export const ADMIN = [
  {
    "bucket": "Config",
    "displayKey": "sidenav.label.admin.bucket.config",
    "entries": [
      {
        "group": "Workflow Settings",
        "displayKey": "sidenav.label.admin.group.WorkflowSettings",
        "items": [
          {
            "editorKey": "SampleEntryConfigurationMenu",
            "displayKey": "sidenav.label.admin.SampleEntryConfigurationMenu",
            "label": "Order Entry"
          },
          {
            "editorKey": "PatientConfigurationMenu",
            "displayKey": "sidenav.label.admin.PatientConfigurationMenu",
            "label": "Patient Entry"
          },
          {
            "editorKey": "ResultConfigurationMenu",
            "displayKey": "sidenav.label.admin.ResultConfigurationMenu",
            "label": "Result Entry"
          },
          {
            "editorKey": "ValidationConfigurationMenu",
            "displayKey": "sidenav.label.admin.ValidationConfigurationMenu",
            "label": "Validation"
          },
          {
            "editorKey": "WorkPlanConfigurationMenu",
            "displayKey": "sidenav.label.admin.WorkPlanConfigurationMenu",
            "label": "Workplan"
          },
          {
            "editorKey": "PrintedReportsConfigurationMenu",
            "displayKey": "sidenav.label.admin.PrintedReportsConfigurationMenu",
            "label": "Printed Reports"
          }
        ]
      },
      {
        "editorKey": "commonproperties",
        "displayKey": "sidenav.label.admin.commonproperties",
        "label": "Application Properties"
      },
      {
        "group": "Menu Configuration",
        "displayKey": "sidenav.label.admin.group.MenuConfiguration",
        "items": [
          {
            "editorKey": "globalMenuManagement",
            "displayKey": "sidenav.label.admin.globalMenuManagement",
            "label": "Main Menu"
          },
          {
            "editorKey": "billingMenuManagement",
            "displayKey": "sidenav.label.admin.billingMenuManagement",
            "label": "Billing Menu"
          },
          {
            "editorKey": "nonConformityMenuManagement",
            "displayKey": "sidenav.label.admin.nonConformityMenuManagement",
            "label": "Non-Conform Menu"
          },
          {
            "editorKey": "patientMenuManagement",
            "displayKey": "sidenav.label.admin.patientMenuManagement",
            "label": "Patient Menu"
          }
        ]
      },
      {
        "editorKey": "labNumber",
        "displayKey": "sidenav.label.admin.labNumber",
        "label": "Lab Number Format"
      },
      {
        "editorKey": "barcodeConfiguration",
        "displayKey": "sidenav.label.admin.barcodeConfiguration",
        "label": "Barcode Configuration"
      },
      {
        "editorKey": "labelPresets",
        "displayKey": "sidenav.label.admin.labelPresets",
        "label": "Label Presets"
      },
      {
        "editorKey": "calendarManagement",
        "displayKey": "sidenav.label.admin.calendarManagement",
        "label": "Calendar"
      },
      {
        "group": "Localization",
        "displayKey": "sidenav.label.admin.group.Localization",
        "items": [
          {
            "editorKey": "languageManagement",
            "displayKey": "sidenav.label.admin.languageManagement",
            "label": "Languages"
          },
          {
            "editorKey": "translationManagement",
            "displayKey": "sidenav.label.admin.translationManagement",
            "label": "Translations"
          }
        ]
      }
    ]
  },
  {
    "bucket": "Organization",
    "displayKey": "sidenav.label.admin.bucket.organization",
    "entries": [
      {
        "editorKey": "SiteInformationMenu",
        "displayKey": "sidenav.label.admin.SiteInformationMenu",
        "label": "Site Information"
      },
      {
        "editorKey": "SiteBrandingMenu",
        "displayKey": "sidenav.label.admin.SiteBrandingMenu",
        "label": "Site Branding"
      },
      {
        "editorKey": "userManagement",
        "displayKey": "sidenav.label.admin.userManagement",
        "label": "Users"
      },
      {
        "editorKey": "NotifyUser",
        "displayKey": "sidenav.label.admin.NotifyUser",
        "label": "Notify Users"
      },
      {
        "editorKey": "organizationManagement",
        "displayKey": "sidenav.label.admin.organizationManagement",
        "label": "Organizations"
      },
      {
        "group": "Providers",
        "displayKey": "sidenav.label.admin.group.Providers",
        "items": [
          {
            "editorKey": "providerMenu",
            "displayKey": "sidenav.label.admin.providerMenu",
            "label": "Providers"
          },
          {
            "editorKey": "providerTitleMenu",
            "displayKey": "sidenav.label.admin.providerTitleMenu",
            "label": "Provider Titles"
          }
        ]
      }
    ]
  },
  {
    "bucket": "Resources",
    "displayKey": "sidenav.label.admin.bucket.resources",
    "entries": [
      {
        "group": "Test Catalog",
        "displayKey": "sidenav.label.admin.group.TestCatalog",
        "items": [
          {
            "editorKey": "TestCatalogList",
            "displayKey": "sidenav.label.admin.TestCatalogList",
            "label": "Tests"
          },
          {
            "editorKey": "TestCatalogList?entity=panels",
            "displayKey": "sidenav.label.admin.TestCatalogListPanels",
            "label": "Panels"
          },
          {
            "editorKey": "SampleTypeEditor",
            "displayKey": "sidenav.label.admin.SampleTypeEditor",
            "label": "Sample Types"
          },
          {
            "editorKey": "LabUnitManagement",
            "displayKey": "sidenav.label.admin.LabUnitManagement",
            "label": "Lab Units"
          },
          {
            "editorKey": "CatalogImport",
            "displayKey": "sidenav.label.admin.CatalogImport",
            "label": "Import Catalog (CSV)"
          },
          {
            "editorKey": "reflex",
            "displayKey": "sidenav.label.admin.reflex",
            "label": "Reflex Rules"
          },
          {
            "editorKey": "calculatedValue",
            "displayKey": "sidenav.label.admin.calculatedValue",
            "label": "Calculated Values"
          }
        ]
      },
      {
        "editorKey": "testManagementConfigMenu",
        "displayKey": "sidenav.label.admin.testManagementConfigMenu",
        "label": "Test Management (legacy)"
      },
      {
        "group": "Microbiology Reference",
        "displayKey": "sidenav.label.admin.group.MicrobiologyReference",
        "items": [
          {
            "editorKey": "MicrobiologyReference/organisms",
            "displayKey": "sidenav.label.admin.MicrobiologyReferenceOrganisms",
            "label": "Organisms"
          },
          {
            "editorKey": "MicrobiologyReference/antibiotics",
            "displayKey": "sidenav.label.admin.MicrobiologyReferenceAntibiotics",
            "label": "Antibiotics"
          },
          {
            "editorKey": "MicrobiologyReference/ast-panels",
            "displayKey": "sidenav.label.admin.MicrobiologyReferenceAstPanels",
            "label": "AST Panels"
          },
          {
            "editorKey": "MicrobiologyReference/culture-setups",
            "displayKey": "sidenav.label.admin.MicrobiologyReferenceCultureSetups",
            "label": "Culture Setups"
          },
          {
            "editorKey": "MicrobiologyReference/breakpoints",
            "displayKey": "sidenav.label.admin.MicrobiologyReferenceBreakpoints",
            "label": "Breakpoints"
          },
          {
            "editorKey": "MicrobiologyReference/patient-origins",
            "displayKey": "sidenav.label.admin.MicrobiologyReferencePatientOrigins",
            "label": "Patient Origins"
          }
        ]
      },
      {
        "group": "Vector Surveillance",
        "displayKey": "sidenav.label.admin.group.VectorSurveillance",
        "items": [
          {
            "editorKey": "vectorSurveillanceSetup/species",
            "displayKey": "sidenav.label.admin.vectorSurveillanceSetupSpecies",
            "label": "Species"
          },
          {
            "editorKey": "vectorSurveillanceSetup/trap-types",
            "displayKey": "sidenav.label.admin.vectorSurveillanceSetupTrapTypes",
            "label": "Trap Types"
          },
          {
            "editorKey": "vectorSurveillanceSetup/sampling-sites",
            "displayKey": "sidenav.label.admin.vectorSurveillanceSetupSamplingSites",
            "label": "Sampling Sites"
          },
          {
            "editorKey": "vectorSurveillanceSetup/manual-entry-fields",
            "displayKey": "sidenav.label.admin.vectorSurveillanceSetupManualEntryFields",
            "label": "Manual Entry Field Map"
          }
        ]
      },
      {
        "editorKey": "ComplianceStandardsAdmin",
        "displayKey": "sidenav.label.admin.environmentalComplianceStandards",
        "label": "Environmental Compliance Standards"
      },
      {
        "editorKey": "program",
        "displayKey": "sidenav.label.admin.program",
        "label": "Programs"
      },
      {
        "editorKey": "DictionaryMenu",
        "displayKey": "sidenav.label.admin.DictionaryMenu",
        "label": "Dictionary"
      }
    ]
  },
  {
    "bucket": "Automation",
    "displayKey": "sidenav.label.admin.bucket.automation",
    "entries": [
      {
        "editorKey": "externalConnections",
        "displayKey": "sidenav.label.admin.externalConnections",
        "label": "External Connections"
      },
      {
        "editorKey": "dataExportStatus",
        "displayKey": "sidenav.label.admin.dataExportStatus",
        "label": "FHIR Data Export Status"
      },
      {
        "editorKey": "resultReportingConfiguration",
        "displayKey": "sidenav.label.admin.resultReportingConfiguration",
        "label": "Result Reporting"
      },
      {
        "editorKey": "testNotificationConfigMenu",
        "displayKey": "sidenav.label.admin.testNotificationConfigMenu",
        "label": "Test Notifications"
      },
      {
        "editorKey": "notificationTriggerConfig",
        "displayKey": "sidenav.label.admin.notificationTriggerConfig",
        "label": "Notification Triggers"
      },
      {
        "editorKey": "batchTestReassignment",
        "displayKey": "sidenav.label.admin.batchTestReassignment",
        "label": "Batch Test Reassignment"
      },
      {
        "editorKey": "SearchIndexManagement",
        "displayKey": "sidenav.label.admin.SearchIndexManagement",
        "label": "Search Index"
      },
      {
        "editorKey": "loggingManagement",
        "displayKey": "sidenav.label.admin.loggingManagement",
        "label": "Logging"
      },
      {
        "editorKey": "DatabaseCleaning",
        "displayKey": "sidenav.label.admin.DatabaseCleaning",
        "label": "Database Cleaning"
      }
    ]
  },
  {
    "bucket": "Compliance",
    "displayKey": "sidenav.label.admin.bucket.compliance",
    "entries": [
      {
        "group": "Sample Acceptance Checklist",
        "displayKey": "sidenav.label.admin.group.SampleAcceptanceChecklist",
        "items": [
          {
            "editorKey": "SampleAcceptanceChecklist/all",
            "displayKey": "sidenav.label.admin.SampleAcceptanceChecklistAll",
            "label": "All Domains"
          },
          {
            "editorKey": "SampleAcceptanceChecklist/clinical",
            "displayKey": "sidenav.label.admin.SampleAcceptanceChecklistClinical",
            "label": "Clinical"
          },
          {
            "editorKey": "SampleAcceptanceChecklist/environmental",
            "displayKey": "sidenav.label.admin.SampleAcceptanceChecklistEnvironmental",
            "label": "Environmental"
          },
          {
            "editorKey": "SampleAcceptanceChecklist/vector",
            "displayKey": "sidenav.label.admin.SampleAcceptanceChecklistVector",
            "label": "Vector"
          }
        ]
      },
      {
        "editorKey": "NonConformityConfigurationMenu",
        "displayKey": "sidenav.label.admin.NonConformityConfigurationMenu",
        "label": "Non-Conformity Reasons"
      }
    ]
  }
];

const useT = () => {
  const intl = useIntl();
  return (key, fallback) => intl.formatMessage({ id: key, defaultMessage: fallback });
};

function visible(item, unifiedResultsOn) {
  if (item.legacyResults && unifiedResultsOn) return false;
  if (item.elementId === "menu_results_unified" && !unifiedResultsOn) return false;
  return true;
}

// FR-17: drop groups and sections whose children are all hidden for this user.
function prune(items, unifiedResultsOn) {
  return items
    .filter((i) => visible(i, unifiedResultsOn))
    .map((i) => (i.childMenus ? { ...i, childMenus: prune(i.childMenus, unifiedResultsOn) } : i))
    .filter((i) => !i.childMenus || i.childMenus.length > 0);
}

function MainMenu({ unifiedResultsOn, onOpenAdmin }) {
  const t = useT();
  const { pathname, search } = useLocation();
  const here = pathname + search;
  const tree = useMemo(() => prune(MENU, unifiedResultsOn), [unifiedResultsOn]);
  const containsHere = (i) =>
    i.actionURL === here || (i.childMenus || []).some(containsHere);

  const render = (item, level = 0) => {
    const label = t(item.displayKey, item.label);
    if (item.presentationStyle === "section") {
      return (
        <React.Fragment key={item.elementId}>
          <SideNavDivider />
          <li className="configured-nav-section"><h2>{label}</h2></li>
          {item.childMenus.map((c) => render(c, 0))}
        </React.Fragment>
      );
    }
    const Icon = level === 0 ? navigationIcons[item.icon] : undefined;
    if (item.childMenus) {
      return (
        <SideNavMenu key={item.elementId} title={label} renderIcon={Icon}
          defaultExpanded={containsHere(item)} isActive={containsHere(item)}>
          {item.childMenus.map((c) => render(c, level + 1))}
        </SideNavMenu>
      );
    }
    if (item.elementId === "menu_administration") {
      // FR-22: Admin swaps the panel to the Admin sidebar; it does not expand in place.
      return (
        <SideNavLink key={item.elementId} renderIcon={Icon} as={Link} to={item.actionURL}
          onClick={onOpenAdmin}>{label}</SideNavLink>
      );
    }
    const Item = level === 0 ? SideNavLink : SideNavMenuItem;
    return (
      <Item key={item.elementId} as={Link} to={item.actionURL}
        {...(level === 0 ? { renderIcon: Icon } : {})}
        isActive={item.actionURL === here} aria-current={item.actionURL === here ? "page" : undefined}>
        {label}
      </Item>
    );
  };
  return <SideNavItems>{tree.map((i) => render(i))}</SideNavItems>;
}

function AdminMenu({ onBack }) {
  const t = useT();
  const { pathname, search } = useLocation();
  const here = pathname + search;
  const to = (k) => `/MasterListsPage/${k}`;
  const leaf = (i, nested) => {
    const Item = nested ? SideNavMenuItem : SideNavLink;
    return (
      <Item key={i.editorKey} as={Link} to={to(i.editorKey)} isActive={here === to(i.editorKey)}>
        {t(i.displayKey, i.label)}
      </Item>
    );
  };
  return (
    <SideNavItems>
      <SideNavLink renderIcon={ArrowLeft} href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>
        {t("sidenav.label.admin.backToMainMenu", "Back to main menu")}
      </SideNavLink>
      {ADMIN.map((b) => (
        <React.Fragment key={b.bucket}>
          <SideNavDivider />
          <li className="configured-nav-section"><h2>{t(b.displayKey, b.bucket)}</h2></li>
          {b.entries.map((e) =>
            e.group ? (
              <SideNavMenu key={e.group} title={t(e.displayKey, e.group)}
                defaultExpanded={e.items.some((i) => here === to(i.editorKey))}>
                {e.items.map((i) => leaf(i, true))}
              </SideNavMenu>
            ) : (
              leaf(e, false)
            )
          )}
        </React.Fragment>
      ))}
      <SideNavDivider />
      <SideNavLink renderIcon={Launch} href="/api/OpenELIS-Global/MasterListsPage" target="_blank" rel="noopener noreferrer">
        {t("admin.legacy", "Legacy Admin")}
      </SideNavLink>
    </SideNavItems>
  );
}

export default function NavigationRedesignMockup({ unifiedResultsOn = true }) {
  const t = useT();
  const [context, setContext] = useState("main");
  return (
    <SideNav aria-label={t("sidenav.label.navigation", "Navigation")} expanded isFixedNav isChildOfHeader={false}>
      {context === "admin" ? (
        <AdminMenu onBack={() => setContext("main")} />
      ) : (
        <MainMenu unifiedResultsOn={unifiedResultsOn} onOpenAdmin={() => setContext("admin")} />
      )}
    </SideNav>
  );
}
