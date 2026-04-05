// src/utils/buildingConfig.js
// ---------------------------
// Central place for building type mappings.
// Used by both EnergyChart and WhatIfSimulator.
// Interview concept: Single source of truth — define config once, import everywhere.

export const BUILDING_MAP = {
  "CSE Block": "Commercial",
  "ECE Block": "Commercial",
  "Mechanical Block": "Industrial",
  "Library": "Residential",
  "Admin Block": "Commercial",
  "Hostel Block": "Residential"
};
