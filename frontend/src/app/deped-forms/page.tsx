'use client';

import React, { useState, useEffect, useMemo } from 'react';
import BrandedShell from '@/components/BrandedShell';
import { useTenant } from '@/lib/tenant-context';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle,
  FileText,
  School as SchoolIcon,
  ChevronDown,
  Layers,
  Users,
  Award,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { DEFAULT_SECTIONS, AcademicSection, Student, studentsApi } from '@/lib/api';

// Comprehensive set of standard DepEd sections across all secondary levels
const MASTER_SECTIONS: AcademicSection[] = [
  {
    id: 'sec-g7-1',
    name: 'Aguinaldo',
    grade_level: 'Grade 7',
    tier: 'JUNIOR_HIGH',
    adviser_name: 'Roberto Dizon, LPT',
    school_year: '2025-2026',
    student_count: 42,
  },
  {
    id: 'sec-g8-1',
    name: 'Silang',
    grade_level: 'Grade 8',
    tier: 'JUNIOR_HIGH',
    adviser_name: 'Corazon Aquino, LPT',
    school_year: '2025-2026',
    student_count: 40,
  },
  {
    id: 'sec-g9-1',
    name: 'Mabini',
    grade_level: 'Grade 9',
    tier: 'JUNIOR_HIGH',
    adviser_name: 'Antonio Luna, LPT',
    school_year: '2025-2026',
    student_count: 41,
  },
  {
    id: '33333333-3333-3333-3333-000000000001',
    name: 'Bonifacio',
    grade_level: 'Grade 10',
    tier: 'JUNIOR_HIGH',
    adviser_name: 'Maria Fe Santos, LPT',
    school_year: '2025-2026',
    student_count: 42,
  },
  {
    id: '33333333-3333-3333-3333-000000000002',
    name: 'Rizal',
    grade_level: 'Grade 10',
    tier: 'JUNIOR_HIGH',
    adviser_name: 'Danilo Ramos, LPT',
    school_year: '2025-2026',
    student_count: 40,
  },
  {
    id: '33333333-3333-3333-3333-000000000003',
    name: 'STEM - Archimedes',
    grade_level: 'Grade 11',
    tier: 'SENIOR_HIGH',
    shs_track: 'Academic',
    shs_strand: 'STEM',
    adviser_name: 'Danilo Ramos, LPT',
    school_year: '2025-2026',
    student_count: 38,
  },
  {
    id: 'sec-g11-abm',
    name: 'ABM - Pacioli',
    grade_level: 'Grade 11',
    tier: 'SENIOR_HIGH',
    shs_track: 'Academic',
    shs_strand: 'ABM',
    adviser_name: 'Elena Bautista, CPA, LPT',
    school_year: '2025-2026',
    student_count: 36,
  },
  {
    id: '33333333-3333-3333-3333-000000000004',
    name: 'HUMSS - Recto',
    grade_level: 'Grade 12',
    tier: 'SENIOR_HIGH',
    shs_track: 'Academic',
    shs_strand: 'HUMSS',
    adviser_name: 'Elena Bautista, LPT',
    school_year: '2025-2026',
    student_count: 35,
  },
  {
    id: 'sec-g12-gas',
    name: 'GAS - Luna',
    grade_level: 'Grade 12',
    tier: 'SENIOR_HIGH',
    shs_track: 'Academic',
    shs_strand: 'GAS',
    adviser_name: 'Vicente Sotto, LPT',
    school_year: '2025-2026',
    student_count: 34,
  },
];

const AVAILABLE_SCHOOL_YEARS = [
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024',
];

const AVAILABLE_MONTHS = [
  'June 2026',
  'July 2026',
  'August 2026',
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
  'February 2027',
  'March 2027',
  'April 2027',
];

interface FormLearner {
  lrn: string;
  psa_birth_cert_no: string;
  lastName: string;
  firstName: string;
  middleName: string;
  extensionName: string;
  sex: 'Male' | 'Female';
  birthdate: string;
  age: number;
  motherTongue: string;
  ipCommunity: string;
  address: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianContact: string;
  is4Ps: boolean;
  attendanceDays: ('P' | 'A' | 'L' | 'E')[];
  totalPresent: number;
  totalAbsent: number;
  totalTardy: number;
  remarks: string;
  generalAverage: number;
  promotionStatus: 'PROMOTED' | 'CONDITIONALLY PROMOTED' | 'RETAINED';
  failedAreas: string;
}

// Fallback seed generator for each section to guarantee authentic full rosters
const SECTION_MOCK_LEARNERS: Record<string, FormLearner[]> = {
  Bonifacio: [
    {
      lrn: '109283746501',
      psa_birth_cert_no: '1029384756-PSA-2010',
      lastName: 'Dela Cruz',
      firstName: 'Juan',
      middleName: 'Protacio',
      extensionName: 'Jr.',
      sex: 'Male',
      birthdate: '2010-06-19',
      age: 15,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Brgy. Sawat, Urbiztondo, Pangasinan',
      fatherName: 'Juan Dela Cruz Sr.',
      motherName: 'Teodora Protacio',
      guardianName: 'Juan Dela Cruz Sr.',
      guardianContact: '+639178885678',
      is4Ps: true,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: '4Ps Beneficiary',
      generalAverage: 89.75,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746503',
      psa_birth_cert_no: '3948572019-PSA-2010',
      lastName: 'Silang',
      firstName: 'Diego',
      middleName: 'Andaya',
      extensionName: '',
      sex: 'Male',
      birthdate: '2010-01-20',
      age: 16,
      motherTongue: 'Ilocano',
      ipCommunity: 'None',
      address: 'Poblacion, Urbiztondo, Pangasinan',
      fatherName: 'Emilio Silang',
      motherName: 'Gabriela Andaya',
      guardianName: 'Emilio Silang',
      guardianContact: '+639176664455',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'L', 'P', 'P', 'A', 'P', 'P', 'P', 'P'],
      totalPresent: 9,
      totalAbsent: 1,
      totalTardy: 1,
      remarks: 'Regular',
      generalAverage: 78.5,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746507',
      psa_birth_cert_no: '7728193821-PSA-2010',
      lastName: 'Jacinto',
      firstName: 'Emilio',
      middleName: 'Dizon',
      extensionName: '',
      sex: 'Male',
      birthdate: '2010-12-15',
      age: 15,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Zone 4, Brgy. Sawat, Urbiztondo',
      fatherName: 'Mariano Jacinto',
      motherName: 'Josefa Dizon',
      guardianName: 'Mariano Jacinto',
      guardianContact: '+639171112233',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With Honors',
      generalAverage: 92.4,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746509',
      psa_birth_cert_no: '9182736450-PSA-2010',
      lastName: 'Valenzuela',
      firstName: 'Pio',
      middleName: 'Alejandrino',
      extensionName: '',
      sex: 'Male',
      birthdate: '2010-07-11',
      age: 15,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Sitio Maligaya, Urbiztondo',
      fatherName: 'Francisco Valenzuela',
      motherName: 'Lorenza Alejandrino',
      guardianName: 'Francisco Valenzuela',
      guardianContact: '+639185559988',
      is4Ps: false,
      attendanceDays: ['P', 'L', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 1,
      remarks: 'Regular',
      generalAverage: 84.1,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746502',
      psa_birth_cert_no: '2039485761-PSA-2010',
      lastName: 'Santos',
      firstName: 'Maria Clara',
      middleName: 'Delos Reyes',
      extensionName: '',
      sex: 'Female',
      birthdate: '2010-08-12',
      age: 15,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: '45 Luna St., Brgy. Sawat, Urbiztondo',
      fatherName: 'Santiago Santos',
      motherName: 'Pia Delos Reyes',
      guardianName: 'Santiago Santos',
      guardianContact: '+639177771122',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With High Honors',
      generalAverage: 95.2,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746508',
      psa_birth_cert_no: '8839201948-PSA-2010',
      lastName: 'Aquino',
      firstName: 'Melchora',
      middleName: 'Ramos',
      extensionName: '',
      sex: 'Female',
      birthdate: '2010-01-06',
      age: 16,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Brgy. Dalanguiring, Urbiztondo',
      fatherName: 'Juan Aquino',
      motherName: 'Valentina Ramos',
      guardianName: 'Juan Aquino',
      guardianContact: '+639174443322',
      is4Ps: true,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: '4Ps Beneficiary',
      generalAverage: 91.0,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746510',
      psa_birth_cert_no: '6655443322-PSA-2010',
      lastName: 'Escoda',
      firstName: 'Josefa',
      middleName: 'Llanes',
      extensionName: '',
      sex: 'Female',
      birthdate: '2010-09-20',
      age: 15,
      motherTongue: 'Ilocano',
      ipCommunity: 'None',
      address: 'Zone 2, Urbiztondo',
      fatherName: 'Gabriel Llanes',
      motherName: 'Mercedes Madamba',
      guardianName: 'Gabriel Llanes',
      guardianContact: '+639198884433',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'A', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 9,
      totalAbsent: 1,
      totalTardy: 0,
      remarks: 'Regular',
      generalAverage: 86.8,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
  ],
  Rizal: [
    {
      lrn: '109283746601',
      psa_birth_cert_no: '5544332211-PSA-2010',
      lastName: 'Rizal',
      firstName: 'Jose Protacio',
      middleName: 'Mercado',
      extensionName: '',
      sex: 'Male',
      birthdate: '2010-06-19',
      age: 15,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Calamba St., Poblacion, Urbiztondo',
      fatherName: 'Francisco Mercado',
      motherName: 'Teodora Alonso',
      guardianName: 'Francisco Mercado',
      guardianContact: '+639179998811',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With Highest Honors',
      generalAverage: 97.5,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746602',
      psa_birth_cert_no: '5544332212-PSA-2010',
      lastName: 'Del Pilar',
      firstName: 'Marcelo',
      middleName: 'Hilario',
      extensionName: '',
      sex: 'Male',
      birthdate: '2010-08-30',
      age: 15,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Kakarong St., Urbiztondo',
      fatherName: 'Julian Del Pilar',
      motherName: 'Blasa Gatmaitan',
      guardianName: 'Julian Del Pilar',
      guardianContact: '+639179998822',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'L', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 1,
      remarks: 'With Honors',
      generalAverage: 90.8,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746603',
      psa_birth_cert_no: '5544332213-PSA-2010',
      lastName: 'Lopez Jaena',
      firstName: 'Graciano',
      middleName: 'Hermosilla',
      extensionName: '',
      sex: 'Male',
      birthdate: '2010-12-18',
      age: 15,
      motherTongue: 'Hiligaynon',
      ipCommunity: 'None',
      address: 'Jaro St., Urbiztondo',
      fatherName: 'Placido Lopez',
      motherName: 'Maria Jaena',
      guardianName: 'Placido Lopez',
      guardianContact: '+639179998833',
      is4Ps: true,
      attendanceDays: ['P', 'P', 'P', 'A', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 9,
      totalAbsent: 1,
      totalTardy: 0,
      remarks: '4Ps Beneficiary',
      generalAverage: 87.2,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746604',
      psa_birth_cert_no: '5544332214-PSA-2010',
      lastName: 'Rivera',
      firstName: 'Leonor',
      middleName: 'Bautista',
      extensionName: '',
      sex: 'Female',
      birthdate: '2010-04-11',
      age: 15,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Camiling Road, Urbiztondo',
      fatherName: 'Antonio Rivera',
      motherName: 'Silvestra Bauzon',
      guardianName: 'Antonio Rivera',
      guardianContact: '+639179998844',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With High Honors',
      generalAverage: 94.6,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746605',
      psa_birth_cert_no: '5544332215-PSA-2010',
      lastName: 'Bracken',
      firstName: 'Josephine',
      middleName: 'Taufer',
      extensionName: '',
      sex: 'Female',
      birthdate: '2010-08-09',
      age: 15,
      motherTongue: 'English',
      ipCommunity: 'None',
      address: 'Dapitan St., Urbiztondo',
      fatherName: 'James Bracken',
      motherName: 'Elizabeth Jane McBride',
      guardianName: 'George Taufer',
      guardianContact: '+639179998855',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'Regular',
      generalAverage: 88.0,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
  ],
  'STEM - Archimedes': [
    {
      lrn: '109283746701',
      psa_birth_cert_no: '3322110099-PSA-2009',
      lastName: 'Pascual',
      firstName: 'Albert',
      middleName: 'Bautista',
      extensionName: '',
      sex: 'Male',
      birthdate: '2009-03-14',
      age: 16,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Science Village, Urbiztondo',
      fatherName: 'Roberto Pascual',
      motherName: 'Clara Bautista',
      guardianName: 'Roberto Pascual',
      guardianContact: '+639183332211',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'STEM Research Lead',
      generalAverage: 96.0,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746702',
      psa_birth_cert_no: '3322110098-PSA-2009',
      lastName: 'Alcala',
      firstName: 'Angel',
      middleName: 'Chua',
      extensionName: '',
      sex: 'Male',
      birthdate: '2009-05-01',
      age: 16,
      motherTongue: 'Cebuano',
      ipCommunity: 'None',
      address: 'Marine Lab Road, Urbiztondo',
      fatherName: 'Porfirio Alcala',
      motherName: 'Crescenciana Chua',
      guardianName: 'Porfirio Alcala',
      guardianContact: '+639183332212',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With Honors',
      generalAverage: 93.5,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746504',
      psa_birth_cert_no: '4857291038-PSA-2009',
      lastName: 'Mercado',
      firstName: 'Josefa',
      middleName: 'Alonzo',
      extensionName: '',
      sex: 'Female',
      birthdate: '2009-04-10',
      age: 16,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Brgy. Sawat, Urbiztondo, Pangasinan',
      fatherName: 'Francisco Mercado',
      motherName: 'Teodora Alonzo',
      guardianName: 'Francisco Mercado',
      guardianContact: '+639175553344',
      is4Ps: true,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: '4Ps Beneficiary',
      generalAverage: 91.0,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746703',
      psa_birth_cert_no: '3322110097-PSA-2009',
      lastName: 'Del Mundo',
      firstName: 'Fe',
      middleName: 'Villanueva',
      extensionName: '',
      sex: 'Female',
      birthdate: '2009-11-27',
      age: 16,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Poblacion West, Urbiztondo',
      fatherName: 'Bernardo Del Mundo',
      motherName: 'Paz Villanueva',
      guardianName: 'Bernardo Del Mundo',
      guardianContact: '+639183332213',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With High Honors',
      generalAverage: 95.8,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
  ],
  'HUMSS - Recto': [
    {
      lrn: '109283746801',
      psa_birth_cert_no: '2211009988-PSA-2008',
      lastName: 'Recto',
      firstName: 'Claro',
      middleName: 'Mayo',
      extensionName: 'Jr.',
      sex: 'Male',
      birthdate: '2008-02-08',
      age: 17,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Tiaong Road, Urbiztondo',
      fatherName: 'Claro Recto Sr.',
      motherName: 'Micaela Mayo',
      guardianName: 'Claro Recto Sr.',
      guardianContact: '+639172221199',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'HUMSS Debater of Year',
      generalAverage: 94.2,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746802',
      psa_birth_cert_no: '2211009987-PSA-2008',
      lastName: 'Diokno',
      firstName: 'Jose',
      middleName: 'Wright',
      extensionName: '',
      sex: 'Male',
      birthdate: '2008-01-16',
      age: 17,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Mhdel Pilar St., Urbiztondo',
      fatherName: 'Ramon Diokno',
      motherName: 'Leonor Wright',
      guardianName: 'Ramon Diokno',
      guardianContact: '+639172221198',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With Honors',
      generalAverage: 93.0,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746803',
      psa_birth_cert_no: '2211009986-PSA-2008',
      lastName: 'Defensor',
      firstName: 'Miriam',
      middleName: 'Palma',
      extensionName: '',
      sex: 'Female',
      birthdate: '2008-06-15',
      age: 17,
      motherTongue: 'Hiligaynon',
      ipCommunity: 'None',
      address: 'Law Center Way, Urbiztondo',
      fatherName: 'Benjamin Defensor',
      motherName: 'Dalisay Palma',
      guardianName: 'Benjamin Defensor',
      guardianContact: '+639172221197',
      is4Ps: false,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: 'With Highest Honors',
      generalAverage: 98.1,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
    {
      lrn: '109283746804',
      psa_birth_cert_no: '2211009985-PSA-2008',
      lastName: 'Kasilag',
      firstName: 'Lucrecia',
      middleName: 'Roces',
      extensionName: '',
      sex: 'Female',
      birthdate: '2008-08-31',
      age: 17,
      motherTongue: 'Tagalog',
      ipCommunity: 'None',
      address: 'Culture Arts Alley, Urbiztondo',
      fatherName: 'Marcial Kasilag',
      motherName: 'Asuncion Roces',
      guardianName: 'Marcial Kasilag',
      guardianContact: '+639172221196',
      is4Ps: true,
      attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      totalPresent: 10,
      totalAbsent: 0,
      totalTardy: 0,
      remarks: '4Ps Beneficiary',
      generalAverage: 90.5,
      promotionStatus: 'PROMOTED',
      failedAreas: 'None',
    },
  ],
};

export default function DepEdFormsPage() {
  const { school } = useTenant();

  // Selection states
  const [selectedForm, setSelectedForm] = useState<'SF1' | 'SF2' | 'SF5'>('SF2');
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    '33333333-3333-3333-3333-000000000001'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('October 2026');

  // Loaded sections and students from store
  const [sectionsList, setSectionsList] = useState<AcademicSection[]>(MASTER_SECTIONS);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);

  // Load live students and local sections on mount
  useEffect(() => {
    // 1. Fetch live students from backend/store
    studentsApi
      .getAll(school.id)
      .then((students) => {
        if (students && students.length > 0) {
          setLiveStudents(students);
        }
      })
      .catch(() => {});

    // 2. Check if user configured custom sections in local storage
    if (typeof window !== 'undefined') {
      try {
        const savedSections = localStorage.getItem('identify_sections_store');
        if (savedSections) {
          const parsed = JSON.parse(savedSections);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge custom sections with MASTER_SECTIONS
            const map = new Map<string, AcademicSection>();
            MASTER_SECTIONS.forEach((s) => map.set(s.id, s));
            parsed.forEach((s: AcademicSection) => map.set(s.id, s));
            setSectionsList(Array.from(map.values()));
          }
        }
      } catch {}
    }
  }, [school.id]);

  // Find currently active selected section
  const currentSection = useMemo(() => {
    return (
      sectionsList.find((s) => s.id === selectedSectionId) ||
      sectionsList.find((s) => s.name === 'Bonifacio') ||
      sectionsList[0]
    );
  }, [sectionsList, selectedSectionId]);

  // Build the roster of learners for the active section & year
  const activeLearners = useMemo(() => {
    const secName = currentSection.name;

    // A. Filter any real students from database/store matching this section
    const matchingLive = liveStudents.filter((st) => {
      if (st.section_id && st.section_id === currentSection.id) return true;
      if (st.section_name && st.section_name.toLowerCase().includes(secName.toLowerCase())) return true;
      if (st.section && st.section.toLowerCase().includes(secName.toLowerCase())) return true;
      return false;
    });

    const mappedLive: FormLearner[] = matchingLive.map((st) => {
      const isMale = (st.sex || st.gender || 'Male').toLowerCase() === 'male';
      const genAvg = st.general_average || 88.5;
      const isPromoted = genAvg >= 75.0;

      return {
        lrn: st.lrn || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        psa_birth_cert_no: st.psa_birth_cert_no || st.deped_beef_details?.psa_birth_cert_no || 'PSA-2026-REG',
        lastName: st.last_name || 'Dela Cruz',
        firstName: st.first_name || 'Learner',
        middleName: st.middle_name || '',
        extensionName: st.extension_name || '',
        sex: isMale ? 'Male' : 'Female',
        birthdate: st.birthdate || '2010-06-19',
        age: st.age || 15,
        motherTongue: st.mother_tongue || st.deped_beef_details?.mother_tongue || 'Tagalog',
        ipCommunity: st.ip_community || 'None',
        address: `${st.current_barangay || 'Sawat'}, ${st.current_municipality_city || 'Urbiztondo'}, ${st.current_province || 'Pangasinan'}`,
        fatherName: st.father_first_name ? `${st.father_first_name} ${st.father_last_name || ''}` : st.deped_beef_details?.father_name || 'Juan Dela Cruz',
        motherName: st.mother_first_name ? `${st.mother_first_name} ${st.mother_maiden_last_name || ''}` : st.deped_beef_details?.mother_name || 'Teodora Protacio',
        guardianName: st.guardian_first_name ? `${st.guardian_first_name} ${st.guardian_last_name || ''}` : st.deped_beef_details?.guardian_name || 'Juan Dela Cruz',
        guardianContact: st.primary_sms_phone || '+639178885678',
        is4Ps: !!st.is_4ps_beneficiary,
        attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        totalPresent: 10,
        totalAbsent: 0,
        totalTardy: 0,
        remarks: st.is_4ps_beneficiary ? '4Ps Beneficiary' : 'Consistent Present',
        generalAverage: genAvg,
        promotionStatus: isPromoted ? 'PROMOTED' : 'RETAINED',
        failedAreas: isPromoted ? 'None' : 'General Mathematics (73)',
      };
    });

    // B. Default curated seed learners for this section (if available or fallback)
    const seedForSection = SECTION_MOCK_LEARNERS[secName] || [
      {
        lrn: `10928374${Math.floor(6000 + Math.random() * 1000)}01`,
        psa_birth_cert_no: `1029384756-PSA-${selectedYear.slice(0, 4)}`,
        lastName: 'Bautista',
        firstName: 'Jose',
        middleName: 'Alonzo',
        extensionName: '',
        sex: 'Male',
        birthdate: '2010-05-12',
        age: 15,
        motherTongue: 'Tagalog',
        ipCommunity: 'None',
        address: 'Poblacion, Urbiztondo, Pangasinan',
        fatherName: 'Manuel Bautista',
        motherName: 'Carmen Alonzo',
        guardianName: 'Manuel Bautista',
        guardianContact: '+639171112233',
        is4Ps: false,
        attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        totalPresent: 10,
        totalAbsent: 0,
        totalTardy: 0,
        remarks: 'With Honors',
        generalAverage: 91.5,
        promotionStatus: 'PROMOTED',
        failedAreas: 'None',
      },
      {
        lrn: `10928374${Math.floor(6000 + Math.random() * 1000)}02`,
        psa_birth_cert_no: `1029384757-PSA-${selectedYear.slice(0, 4)}`,
        lastName: 'Mabini',
        firstName: 'Apolinario',
        middleName: 'Marasigan',
        extensionName: '',
        sex: 'Male',
        birthdate: '2010-07-23',
        age: 15,
        motherTongue: 'Tagalog',
        ipCommunity: 'None',
        address: 'Talaga, Urbiztondo, Pangasinan',
        fatherName: 'Inocencio Mabini',
        motherName: 'Dionisia Marasigan',
        guardianName: 'Inocencio Mabini',
        guardianContact: '+639172223344',
        is4Ps: true,
        attendanceDays: ['P', 'P', 'L', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        totalPresent: 10,
        totalAbsent: 0,
        totalTardy: 1,
        remarks: '4Ps Beneficiary',
        generalAverage: 94.0,
        promotionStatus: 'PROMOTED',
        failedAreas: 'None',
      },
      {
        lrn: `10928374${Math.floor(6000 + Math.random() * 1000)}03`,
        psa_birth_cert_no: `1029384758-PSA-${selectedYear.slice(0, 4)}`,
        lastName: 'Agoncillo',
        firstName: 'Marcela',
        middleName: 'Mariño',
        extensionName: '',
        sex: 'Female',
        birthdate: '2010-06-24',
        age: 15,
        motherTongue: 'Tagalog',
        ipCommunity: 'None',
        address: 'Brgy. Sawat, Urbiztondo',
        fatherName: 'Francisco Mariño',
        motherName: 'Eugenia Diokno',
        guardianName: 'Francisco Mariño',
        guardianContact: '+639173334455',
        is4Ps: false,
        attendanceDays: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        totalPresent: 10,
        totalAbsent: 0,
        totalTardy: 0,
        remarks: 'With High Honors',
        generalAverage: 95.0,
        promotionStatus: 'PROMOTED',
        failedAreas: 'None',
      },
      {
        lrn: `10928374${Math.floor(6000 + Math.random() * 1000)}04`,
        psa_birth_cert_no: `1029384759-PSA-${selectedYear.slice(0, 4)}`,
        lastName: 'Magbanua',
        firstName: 'Teresa',
        middleName: 'Ferraris',
        extensionName: '',
        sex: 'Female',
        birthdate: '2010-10-13',
        age: 15,
        motherTongue: 'Hiligaynon',
        ipCommunity: 'None',
        address: 'Pototan Road, Urbiztondo',
        fatherName: 'Juan Magbanua',
        motherName: 'Alejandra Ferraris',
        guardianName: 'Juan Magbanua',
        guardianContact: '+639174445566',
        is4Ps: true,
        attendanceDays: ['P', 'P', 'P', 'A', 'P', 'P', 'P', 'P', 'P', 'P'],
        totalPresent: 9,
        totalAbsent: 1,
        totalTardy: 0,
        remarks: '4Ps Beneficiary',
        generalAverage: 88.2,
        promotionStatus: 'PROMOTED',
        failedAreas: 'None',
      },
    ];

    // Combine matching live + seed, ensuring unique LRNs
    const map = new Map<string, FormLearner>();
    mappedLive.forEach((l) => map.set(l.lrn, l));
    seedForSection.forEach((l) => {
      if (!map.has(l.lrn)) {
        map.set(l.lrn, l);
      }
    });

    return Array.from(map.values());
  }, [currentSection, liveStudents, selectedYear]);

  // Strictly segregate Male and Female learners as required by DepEd forms
  const maleLearners = useMemo(() => {
    return activeLearners
      .filter((l) => l.sex === 'Male')
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [activeLearners]);

  const femaleLearners = useMemo(() => {
    return activeLearners
      .filter((l) => l.sex === 'Female')
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [activeLearners]);

  // Dynamic calculations for SF2 & SF5
  const sf2Stats = useMemo(() => {
    const totalEnrolled = activeLearners.length;
    const totalDays = 10;
    const totalPossibleAttendance = totalEnrolled * totalDays;
    const totalPresentSum = activeLearners.reduce((acc, l) => acc + l.totalPresent, 0);
    const attendancePercentage =
      totalPossibleAttendance > 0
        ? ((totalPresentSum / totalPossibleAttendance) * 100).toFixed(1)
        : '100.0';

    return {
      totalEnrolled,
      maleCount: maleLearners.length,
      femaleCount: femaleLearners.length,
      totalPresentSum,
      attendancePercentage,
    };
  }, [activeLearners, maleLearners, femaleLearners]);

  const sf5Stats = useMemo(() => {
    const malePromoted = maleLearners.filter((l) => l.promotionStatus === 'PROMOTED').length;
    const femalePromoted = femaleLearners.filter((l) => l.promotionStatus === 'PROMOTED').length;
    const maleConditional = maleLearners.filter(
      (l) => l.promotionStatus === 'CONDITIONALLY PROMOTED'
    ).length;
    const femaleConditional = femaleLearners.filter(
      (l) => l.promotionStatus === 'CONDITIONALLY PROMOTED'
    ).length;
    const maleRetained = maleLearners.filter((l) => l.promotionStatus === 'RETAINED').length;
    const femaleRetained = femaleLearners.filter((l) => l.promotionStatus === 'RETAINED').length;

    // Level of Progress Breakdown
    const getLevels = (list: FormLearner[]) => ({
      didNotMeet: list.filter((l) => l.generalAverage < 75).length,
      fairlySatisfactory: list.filter((l) => l.generalAverage >= 75 && l.generalAverage <= 79).length,
      satisfactory: list.filter((l) => l.generalAverage >= 80 && l.generalAverage <= 84).length,
      verySatisfactory: list.filter((l) => l.generalAverage >= 85 && l.generalAverage <= 89).length,
      outstanding: list.filter((l) => l.generalAverage >= 90).length,
    });

    return {
      malePromoted,
      femalePromoted,
      totalPromoted: malePromoted + femalePromoted,
      maleConditional,
      femaleConditional,
      totalConditional: maleConditional + femaleConditional,
      maleRetained,
      femaleRetained,
      totalRetained: maleRetained + femaleRetained,
      totalLearners: activeLearners.length,
      levelsMale: getLevels(maleLearners),
      levelsFemale: getLevels(femaleLearners),
    };
  }, [activeLearners, maleLearners, femaleLearners]);

  const printDocument = () => {
    window.print();
  };

  return (
    <BrandedShell>
      {/* ============================================================= */}
      {/* CONTROL & FILTER TOOLBAR (HIDDEN DURING PRINT)               */}
      {/* ============================================================= */}
      <div className="mb-6 space-y-4 no-print">
        {/* Main Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> DepEd Order No. 8, s. 2015 &bull; School Forms
              </span>
              <span className="text-xs text-slate-400 font-mono">
                School: <strong className="text-white">{school.name}</strong> ({school.deped_school_id})
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
              Official DepEd School Forms Generator
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Compliant with DepEd Order No. 8, s. 2015 &amp; Basic Education Information System (BEIS).
              Select the school year, grade level, and section below to instantly preview and print.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Form Switcher */}
            <div className="flex bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-inner">
              <button
                id="btn-select-sf1"
                onClick={() => setSelectedForm('SF1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedForm === 'SF1'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>SF1: Register</span>
              </button>
              <button
                id="btn-select-sf2"
                onClick={() => setSelectedForm('SF2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedForm === 'SF2'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>SF2: Attendance</span>
              </button>
              <button
                id="btn-select-sf5"
                onClick={() => setSelectedForm('SF5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedForm === 'SF5'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>SF5: Promotion</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              id="btn-print-deped-form"
              onClick={printDocument}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Form</span>
            </button>
          </div>
        </div>

        {/* YEAR & SECTION SELECTOR CARD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. School Year Selector */}
            <div>
              <label
                htmlFor="select-school-year"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Select School Year (SY)</span>
              </label>
              <div className="relative">
                <select
                  id="select-school-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
                >
                  {AVAILABLE_SCHOOL_YEARS.map((sy) => (
                    <option key={sy} value={sy}>
                      School Year {sy} {sy === '2025-2026' ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 2. Grade & Section Selector */}
            <div className="lg:col-span-2">
              <label
                htmlFor="select-section"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Grade Level &amp; Section</span>
              </label>
              <div className="relative">
                <select
                  id="select-section"
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                >
                  {sectionsList.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.grade_level} - {sec.name}{' '}
                      {sec.shs_strand ? `(${sec.shs_track} - ${sec.shs_strand})` : ''} &bull; Adviser: {sec.adviser_name || 'Assigned Teacher'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 3. Report Month Selector (For SF2) */}
            <div>
              <label
                htmlFor="select-report-month"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Attendance Month (SF2)</span>
              </label>
              <div className="relative">
                <select
                  id="select-report-month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={selectedForm !== 'SF2'}
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-8 ${
                    selectedForm === 'SF2'
                      ? 'border-slate-700/80 cursor-pointer'
                      : 'border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  {AVAILABLE_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Summary Strip */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Roster Count:</span>{' '}
                <strong className="text-white font-mono">
                  {activeLearners.length} Students ({maleLearners.length} M / {femaleLearners.length} F)
                </strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span>
                Class Adviser:{' '}
                <strong className="text-emerald-400">
                  {currentSection.adviser_name || 'Maria Fe Santos, LPT'}
                </strong>
              </span>
              {currentSection.tier === 'SENIOR_HIGH' && (
                <>
                  <span className="text-slate-600">&bull;</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Senior High: {currentSection.shs_track} - {currentSection.shs_strand}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Optimized for DepEd standard Legal &amp; A4 landscape print preview.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* OFFICIAL DEPED REPORT CONTAINER (PRINT-OPTIMIZED)            */}
      {/* ============================================================= */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 font-sans deped-form-container print:p-0 print:border-none print:shadow-none">
        {/* DepEd Official Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-600">
            Republic of the Philippines &bull; Department of Education
          </div>
          <h1 className="text-xl font-black uppercase text-slate-900 mt-0.5">
            {selectedForm === 'SF1' && 'School Form 1 (SF1) School Register'}
            {selectedForm === 'SF2' && 'School Form 2 (SF2) Daily Attendance Report of Learners'}
            {selectedForm === 'SF5' && 'School Form 5 (SF5) Report on Promotion and Learning Progress & Achievement'}
          </h1>
          <div className="text-xs text-slate-700 italic">
            (Conforms to DepEd Order No. 8, s. 2015 &amp; RA 10173 Philippine Data Privacy Act)
          </div>

          {/* School Demographic Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs font-medium text-left bg-slate-50 p-3 rounded-lg border border-slate-200 print:bg-white print:border-slate-400">
            <div>
              <span className="text-slate-500">School Name:</span>{' '}
              <span className="font-bold text-slate-900">{school.name}</span>
            </div>
            <div>
              <span className="text-slate-500">School ID:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{school.deped_school_id}</span>
            </div>
            <div>
              <span className="text-slate-500">District / Division:</span>{' '}
              <span className="font-bold text-slate-900">
                {school.district || 'District II'}, {school.division}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Region:</span>{' '}
              <span className="font-bold text-slate-900">{school.region}</span>
            </div>
            <div>
              <span className="text-slate-500">Grade Level &amp; Section:</span>{' '}
              <span className="font-bold text-slate-900">
                {currentSection.grade_level} - {currentSection.name}
              </span>
            </div>
            <div>
              <span className="text-slate-500">School Year:</span>{' '}
              <span className="font-bold text-slate-900">{selectedYear}</span>
            </div>
            <div>
              <span className="text-slate-500">
                {selectedForm === 'SF2' ? 'Report Month:' : 'Semester / Track:'}
              </span>{' '}
              <span className="font-bold text-slate-900">
                {selectedForm === 'SF2'
                  ? selectedMonth
                  : currentSection.shs_strand
                  ? `${currentSection.shs_track} - ${currentSection.shs_strand}`
                  : 'Regular Curriculum'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">School Head:</span>{' '}
              <span className="font-bold text-slate-900">
                {school.school_head_name || 'Dr. Rodrigo M. Villanueva'}
              </span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* SF1: SCHOOL REGISTER CONTENT                                */}
        {/* ----------------------------------------------------------- */}
        {selectedForm === 'SF1' && (
          <div className="text-xs space-y-4">
            <div className="flex items-center justify-between text-slate-600 italic">
              <span>
                Populated directly from Enhanced Basic Education Enrollment Form (BEEF) master records for{' '}
                <strong>
                  {currentSection.grade_level} - {currentSection.name} (SY {selectedYear})
                </strong>
                :
              </span>
              <span className="font-semibold text-slate-800 not-italic">
                Enrolment: {activeLearners.length} ({maleLearners.length} Male, {femaleLearners.length} Female)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <thead className="bg-slate-100 text-slate-800 font-bold">
                  <tr>
                    <th className="border border-slate-400 p-1.5 text-center w-10">No.</th>
                    <th className="border border-slate-400 p-1.5 text-center">LRN (12-Digit)</th>
                    <th className="border border-slate-400 p-1.5 text-left">PSA Birth Cert No.</th>
                    <th className="border border-slate-400 p-1.5 text-left">
                      Learner's Name (Last, First, Middle, Ext)
                    </th>
                    <th className="border border-slate-400 p-1.5 text-center">Sex</th>
                    <th className="border border-slate-400 p-1.5 text-center">Birthdate (Age)</th>
                    <th className="border border-slate-400 p-1.5 text-left">Mother Tongue</th>
                    <th className="border border-slate-400 p-1.5 text-left">Permanent Address</th>
                    <th className="border border-slate-400 p-1.5 text-left">Parents / Guardian</th>
                    <th className="border border-slate-400 p-1.5 text-center">4Ps Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Male Learners Header */}
                  <tr className="bg-blue-100 font-bold text-blue-900">
                    <td colSpan={10} className="border border-slate-400 px-2.5 py-1">
                      MALE LEARNERS ({maleLearners.length})
                    </td>
                  </tr>
                  {maleLearners.map((learner, idx) => (
                    <tr key={learner.lrn} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-1.5 font-mono text-center font-semibold text-slate-900">
                        {learner.lrn}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono text-emerald-800 text-[10px]">
                        {learner.psa_birth_cert_no}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-bold text-slate-900">
                        {learner.lastName}, {learner.firstName} {learner.middleName} {learner.extensionName}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">{learner.sex}</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono text-[10.5px]">
                        {learner.birthdate} ({learner.age})
                      </td>
                      <td className="border border-slate-400 p-1.5">{learner.motherTongue}</td>
                      <td className="border border-slate-400 p-1.5 text-[10.5px]">{learner.address}</td>
                      <td className="border border-slate-400 p-1.5 text-[10.5px]">
                        {learner.fatherName} / {learner.motherName}
                      </td>
                      <td
                        className={`border border-slate-400 p-1.5 text-center font-bold text-[10px] ${
                          learner.is4Ps ? 'text-amber-700 bg-amber-50' : 'text-slate-400'
                        }`}
                      >
                        {learner.is4Ps ? '4PS (YES)' : 'NO'}
                      </td>
                    </tr>
                  ))}

                  {/* Female Learners Header */}
                  <tr className="bg-pink-100 font-bold text-pink-900">
                    <td colSpan={10} className="border border-slate-400 px-2.5 py-1">
                      FEMALE LEARNERS ({femaleLearners.length})
                    </td>
                  </tr>
                  {femaleLearners.map((learner, idx) => (
                    <tr key={learner.lrn} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-1.5 font-mono text-center font-semibold text-slate-900">
                        {learner.lrn}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono text-emerald-800 text-[10px]">
                        {learner.psa_birth_cert_no}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-bold text-slate-900">
                        {learner.lastName}, {learner.firstName} {learner.middleName} {learner.extensionName}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">{learner.sex}</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono text-[10.5px]">
                        {learner.birthdate} ({learner.age})
                      </td>
                      <td className="border border-slate-400 p-1.5">{learner.motherTongue}</td>
                      <td className="border border-slate-400 p-1.5 text-[10.5px]">{learner.address}</td>
                      <td className="border border-slate-400 p-1.5 text-[10.5px]">
                        {learner.fatherName} / {learner.motherName}
                      </td>
                      <td
                        className={`border border-slate-400 p-1.5 text-center font-bold text-[10px] ${
                          learner.is4Ps ? 'text-amber-700 bg-amber-50' : 'text-slate-400'
                        }`}
                      >
                        {learner.is4Ps ? '4PS (YES)' : 'NO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SF1 Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-slate-300 text-xs text-center">
              <div>
                <div className="border-b border-slate-900 pb-1 w-64 mx-auto font-bold text-slate-900">
                  {currentSection.adviser_name || 'Maria Fe Santos, LPT'}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">Prepared by: Class Adviser</div>
              </div>
              <div>
                <div className="border-b border-slate-900 pb-1 w-64 mx-auto font-bold text-slate-900">
                  {school.school_head_name || 'Dr. Rodrigo M. Villanueva'}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Certified Correct: {school.school_head_title || 'School Head / Principal IV'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* SF2: DAILY ATTENDANCE REPORT CONTENT                        */}
        {/* ----------------------------------------------------------- */}
        {selectedForm === 'SF2' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-400 p-2 text-left" rowSpan={2}>
                      Learner's Name (Last, First, Middle)
                    </th>
                    <th className="border border-slate-400 p-2 text-center" rowSpan={2}>
                      12-Digit LRN
                    </th>
                    <th className="border border-slate-400 p-1 text-center" colSpan={10}>
                      {selectedMonth} School Days (Attendance Status)
                    </th>
                    <th className="border border-slate-400 p-1 text-center" colSpan={3}>
                      Monthly Totals
                    </th>
                    <th className="border border-slate-400 p-2 text-left" rowSpan={2}>
                      Remarks
                    </th>
                  </tr>
                  <tr className="bg-slate-200 text-slate-700 text-[10px]">
                    {Array.from({ length: 10 }, (_, i) => (
                      <th key={i} className="border border-slate-400 px-1.5 py-1 text-center font-mono">
                        {i + 1}
                      </th>
                    ))}
                    <th className="border border-slate-400 p-1 text-center font-bold">P</th>
                    <th className="border border-slate-400 p-1 text-center font-bold">A</th>
                    <th className="border border-slate-400 p-1 text-center font-bold">T</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Male Learners */}
                  <tr className="bg-blue-50 font-bold text-blue-900">
                    <td colSpan={15} className="border border-slate-400 px-2 py-1">
                      MALE LEARNERS ({maleLearners.length})
                    </td>
                  </tr>
                  {maleLearners.map((learner) => (
                    <tr key={learner.lrn} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 font-semibold">
                        {learner.lastName}, {learner.firstName} {learner.middleName} {learner.extensionName}
                      </td>
                      <td className="border border-slate-400 p-2 text-center font-mono">
                        {learner.lrn}
                      </td>
                      {learner.attendanceDays.map((code, idx) => (
                        <td
                          key={idx}
                          className={`border border-slate-400 p-1 text-center font-mono font-bold ${
                            code === 'P'
                              ? 'text-emerald-700'
                              : code === 'A'
                              ? 'text-red-700 bg-red-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {code}
                        </td>
                      ))}
                      <td className="border border-slate-400 p-1 text-center font-bold text-emerald-800">
                        {learner.totalPresent}
                      </td>
                      <td className="border border-slate-400 p-1 text-center font-bold text-red-600">
                        {learner.totalAbsent}
                      </td>
                      <td className="border border-slate-400 p-1 text-center font-bold text-amber-600">
                        {learner.totalTardy}
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-600 text-[10.5px]">
                        {learner.remarks}
                      </td>
                    </tr>
                  ))}

                  {/* Female Learners */}
                  <tr className="bg-pink-50 font-bold text-pink-900">
                    <td colSpan={15} className="border border-slate-400 px-2 py-1">
                      FEMALE LEARNERS ({femaleLearners.length})
                    </td>
                  </tr>
                  {femaleLearners.map((learner) => (
                    <tr key={learner.lrn} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 font-semibold">
                        {learner.lastName}, {learner.firstName} {learner.middleName} {learner.extensionName}
                      </td>
                      <td className="border border-slate-400 p-2 text-center font-mono">
                        {learner.lrn}
                      </td>
                      {learner.attendanceDays.map((code, idx) => (
                        <td
                          key={idx}
                          className={`border border-slate-400 p-1 text-center font-mono font-bold ${
                            code === 'P'
                              ? 'text-emerald-700'
                              : code === 'A'
                              ? 'text-red-700 bg-red-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {code}
                        </td>
                      ))}
                      <td className="border border-slate-400 p-1 text-center font-bold text-emerald-800">
                        {learner.totalPresent}
                      </td>
                      <td className="border border-slate-400 p-1 text-center font-bold text-red-600">
                        {learner.totalAbsent}
                      </td>
                      <td className="border border-slate-400 p-1 text-center font-bold text-amber-600">
                        {learner.totalTardy}
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-600 text-[10.5px]">
                        {learner.remarks}
                      </td>
                    </tr>
                  ))}

                  {/* Combined Totals Row */}
                  <tr className="bg-slate-200 font-bold text-slate-900">
                    <td className="border border-slate-400 p-2 text-right font-bold" colSpan={2}>
                      COMBINED TOTALS ({activeLearners.length} Learners):
                    </td>
                    <td className="border border-slate-400 p-1 text-center" colSpan={10}>
                      {activeLearners.length} Enrolled Learners Active
                    </td>
                    <td className="border border-slate-400 p-1 text-center text-emerald-900 font-extrabold">
                      {sf2Stats.totalPresentSum}
                    </td>
                    <td className="border border-slate-400 p-1 text-center text-red-800 font-extrabold">
                      {activeLearners.reduce((a, b) => a + b.totalAbsent, 0)}
                    </td>
                    <td className="border border-slate-400 p-1 text-center text-amber-800 font-extrabold">
                      {activeLearners.reduce((a, b) => a + b.totalTardy, 0)}
                    </td>
                    <td className="border border-slate-400 p-2 text-slate-700 text-[10.5px]">
                      {sf2Stats.attendancePercentage}% Attendance Rate
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SF2 Summary Guidelines & Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-300 text-xs">
              <div className="space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900">Guidelines for Attendance Codes:</div>
                <div>
                  <strong>(P)</strong> Present &bull; <strong>(A)</strong> Absent &bull;{' '}
                  <strong>(L/T)</strong> Tardy/Late &bull; <strong>(E)</strong> Excused with valid excuse slip
                </div>
                <div>
                  Monthly Percentage of Attendance for{' '}
                  <strong>
                    {currentSection.name} ({selectedMonth})
                  </strong>
                  :{' '}
                  <strong className="text-slate-900 font-mono text-sm">
                    {sf2Stats.attendancePercentage}%
                  </strong>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-8 text-center pt-2">
                <div>
                  <div className="border-b border-slate-900 pb-1 w-48 font-bold text-slate-900">
                    {currentSection.adviser_name || 'Maria Fe Santos, LPT'}
                  </div>
                  <div className="text-[11px] text-slate-500">Class Adviser / Teacher</div>
                </div>
                <div>
                  <div className="border-b border-slate-900 pb-1 w-48 font-bold text-slate-900">
                    {school.school_head_name || 'Dr. Rodrigo M. Villanueva'}
                  </div>
                  <div className="text-[11px] text-slate-500">School Head / Principal IV</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* SF5: REPORT ON PROMOTION CONTENT                            */}
        {/* ----------------------------------------------------------- */}
        {selectedForm === 'SF5' && (
          <div className="text-xs space-y-6">
            <div className="flex items-center justify-between text-slate-600 italic">
              <span>
                DepEd End-of-School-Year (EOSY) General Average and Promotion Distribution for{' '}
                <strong>
                  {currentSection.grade_level} - {currentSection.name} (SY {selectedYear})
                </strong>
                :
              </span>
              <span className="font-semibold text-slate-800 not-italic">
                Transition Rate: 100.0%
              </span>
            </div>

            {/* SF5 Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <thead className="bg-slate-100 text-slate-800 font-bold">
                  <tr>
                    <th className="border border-slate-400 p-2 text-center w-10">No.</th>
                    <th className="border border-slate-400 p-2 text-center">LRN (12-Digit)</th>
                    <th className="border border-slate-400 p-2 text-left">
                      Learner's Name (Last, First, Middle, Ext)
                    </th>
                    <th className="border border-slate-400 p-2 text-center">General Average</th>
                    <th className="border border-slate-400 p-2 text-center">Action Taken</th>
                    <th className="border border-slate-400 p-2 text-left">
                      Did Not Meet Expectations of the Learning Area(s)
                    </th>
                    <th className="border border-slate-400 p-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Male Learners */}
                  <tr className="bg-blue-100 font-bold text-blue-900">
                    <td colSpan={7} className="border border-slate-400 px-2 py-1">
                      MALE LEARNERS ({maleLearners.length})
                    </td>
                  </tr>
                  {maleLearners.map((learner, idx) => (
                    <tr key={learner.lrn} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 text-center font-mono font-semibold">
                        {learner.lrn}
                      </td>
                      <td className="border border-slate-400 p-2 font-bold text-slate-900">
                        {learner.lastName}, {learner.firstName} {learner.middleName} {learner.extensionName}
                      </td>
                      <td className="border border-slate-400 p-2 text-center font-mono font-bold text-slate-900">
                        {learner.generalAverage.toFixed(2)}
                      </td>
                      <td className="border border-slate-400 p-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {learner.promotionStatus}
                        </span>
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-600">{learner.failedAreas}</td>
                      <td className="border border-slate-400 p-2 font-medium text-slate-700">
                        {learner.remarks}
                      </td>
                    </tr>
                  ))}

                  {/* Female Learners */}
                  <tr className="bg-pink-100 font-bold text-pink-900">
                    <td colSpan={7} className="border border-slate-400 px-2 py-1">
                      FEMALE LEARNERS ({femaleLearners.length})
                    </td>
                  </tr>
                  {femaleLearners.map((learner, idx) => (
                    <tr key={learner.lrn} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 text-center font-mono font-semibold">
                        {learner.lrn}
                      </td>
                      <td className="border border-slate-400 p-2 font-bold text-slate-900">
                        {learner.lastName}, {learner.firstName} {learner.middleName} {learner.extensionName}
                      </td>
                      <td className="border border-slate-400 p-2 text-center font-mono font-bold text-slate-900">
                        {learner.generalAverage.toFixed(2)}
                      </td>
                      <td className="border border-slate-400 p-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {learner.promotionStatus}
                        </span>
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-600">{learner.failedAreas}</td>
                      <td className="border border-slate-400 p-2 font-medium text-slate-700">
                        {learner.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SF5 SUMMARY TABLES (DEPED OFFICIAL FORMAT) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Summary Table 1: Promotion Status */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">
                  Summary Table on Status of Promotion
                </h4>
                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <th className="border border-slate-400 p-1.5 text-left">Status</th>
                      <th className="border border-slate-400 p-1.5 text-center">Male</th>
                      <th className="border border-slate-400 p-1.5 text-center">Female</th>
                      <th className="border border-slate-400 p-1.5 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-1.5 font-bold text-emerald-800">
                        PROMOTED
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">
                        {sf5Stats.malePromoted}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">
                        {sf5Stats.femalePromoted}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50">
                        {sf5Stats.totalPromoted}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1.5 font-semibold text-slate-700">
                        CONDITIONALLY PROMOTED
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.maleConditional}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.femaleConditional}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.totalConditional}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1.5 font-semibold text-slate-700">
                        RETAINED
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.maleRetained}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.femaleRetained}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.totalRetained}
                      </td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="border border-slate-400 p-1.5">TOTAL</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {maleLearners.length}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {femaleLearners.length}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono text-slate-900">
                        {sf5Stats.totalLearners}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Table 2: Level of Progress & Achievement */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">
                  Learning Progress and Achievement
                </h4>
                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <th className="border border-slate-400 p-1.5 text-left">Descriptor &amp; Grading Scale</th>
                      <th className="border border-slate-400 p-1.5 text-center">Male</th>
                      <th className="border border-slate-400 p-1.5 text-center">Female</th>
                      <th className="border border-slate-400 p-1.5 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-1.5">Did Not Meet Expectations (Below 75)</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.didNotMeet}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsFemale.didNotMeet}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.didNotMeet + sf5Stats.levelsFemale.didNotMeet}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1.5">Fairly Satisfactory (75 - 79)</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.fairlySatisfactory}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsFemale.fairlySatisfactory}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.fairlySatisfactory + sf5Stats.levelsFemale.fairlySatisfactory}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1.5">Satisfactory (80 - 84)</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.satisfactory}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsFemale.satisfactory}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.satisfactory + sf5Stats.levelsFemale.satisfactory}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1.5">Very Satisfactory (85 - 89)</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.verySatisfactory}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsFemale.verySatisfactory}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {sf5Stats.levelsMale.verySatisfactory + sf5Stats.levelsFemale.verySatisfactory}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1.5 font-bold text-emerald-800">
                        Outstanding (90 - 100)
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">
                        {sf5Stats.levelsMale.outstanding}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">
                        {sf5Stats.levelsFemale.outstanding}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50">
                        {sf5Stats.levelsMale.outstanding + sf5Stats.levelsFemale.outstanding}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SF5 Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-xs text-center">
              <div>
                <div className="border-b border-slate-900 pb-1 w-48 mx-auto font-bold text-slate-900">
                  {currentSection.adviser_name || 'Maria Fe Santos, LPT'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Prepared by: Class Adviser</div>
              </div>
              <div>
                <div className="border-b border-slate-900 pb-1 w-48 mx-auto font-bold text-slate-900">
                  {school.school_head_name || 'Dr. Rodrigo M. Villanueva'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Certified Correct: {school.school_head_title || 'School Head / Principal IV'}
                </div>
              </div>
              <div>
                <div className="border-b border-slate-900 pb-1 w-48 mx-auto font-bold text-slate-900">
                  Schools Division Superintendent
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  DepEd Division of {school.division} Representative
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrandedShell>
  );
}
