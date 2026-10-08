'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { enrollmentApi, EnrollmentApplication, getSchoolEnabledGrades } from '@/lib/api';
import IdentifyLogo from '@/components/IdentifyLogo';
import {
  FileText,
  User,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  School,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  QrCode,
  GraduationCap,
  HeartHandshake,
} from 'lucide-react';

export default function PublicEnrollmentPage() {
  const { school, availableSchools, setSchool } = useTenant();

  // Form State
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 1');
  const [tier, setTier] = useState<'ELEMENTARY' | 'JUNIOR_HIGH' | 'SENIOR_HIGH'>('ELEMENTARY');
  const [track, setTrack] = useState<string>('Academic');
  const [strand, setStrand] = useState<string>('STEM');
  const [learnerType, setLearnerType] = useState<'NEW' | 'RETURNING' | 'TRANSFEREE'>('NEW');
  const [hasLrn, setHasLrn] = useState<boolean>(true);
  const [lrn, setLrn] = useState<string>('109283749102');
  const [psaBirthCertNo, setPsaBirthCertNo] = useState<string>('1029384756-PSA-2019');
  
  // Learner Names
  const [lastName, setLastName] = useState<string>('Bautista');
  const [firstName, setFirstName] = useState<string>('Mateo');
  const [middleName, setMiddleName] = useState<string>('Santos');
  const [extensionName, setExtensionName] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('2019-08-14');
  const [age, setAge] = useState<number>(6);
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [motherTongue, setMotherTongue] = useState<string>('Tagalog');
  const [isIpCommunity, setIsIpCommunity] = useState<boolean>(false);
  const [ipCommunity, setIpCommunity] = useState<string>('');
  const [is4ps, setIs4ps] = useState<boolean>(false);
  const [household4psId, setHousehold4psId] = useState<string>('');
  const [hasDisability, setHasDisability] = useState<boolean>(false);
  const [disabilityDetails, setDisabilityDetails] = useState<string>('');

  // Residential Address
  const [houseNo, setHouseNo] = useState<string>('Lot 14 Blk 3');
  const [street, setStreet] = useState<string>('Mabini Street');
  const [barangay, setBarangay] = useState<string>('Sawat');
  const [municipalityCity, setMunicipalityCity] = useState<string>('Urbiztondo');
  const [province, setProvince] = useState<string>('Pangasinan');
  const [region, setRegion] = useState<string>('Region I - Ilocos Region');

  // Prior School
  const [lastSchoolAttended, setLastSchoolAttended] = useState<string>('Sawat Barangay Day Care Center');
  const [lastSchoolId, setLastSchoolId] = useState<string>('105942');
  const [lastGradeCompleted, setLastGradeCompleted] = useState<string>('Kindergarten');
  const [lastSchoolYearCompleted, setLastSchoolYearCompleted] = useState<string>('2025-2026');

  // Parents / Guardians
  const [fatherName, setFatherName] = useState<string>('Eduardo Bautista');
  const [fatherContact, setFatherContact] = useState<string>('+639178821101');
  const [motherName, setMotherName] = useState<string>('Lourdes Santos-Bautista');
  const [motherContact, setMotherContact] = useState<string>('+639178821102');
  const [guardianName, setGuardianName] = useState<string>('Lourdes Santos-Bautista');
  const [guardianRelationship, setGuardianRelationship] = useState<string>('Mother');
  const [guardianContact, setGuardianContact] = useState<string>('+639178821102');
  const [primarySmsPhone, setPrimarySmsPhone] = useState<string>('+639178821102');
  const [emergencyContact, setEmergencyContact] = useState<string>('Lourdes Santos-Bautista (+639178821102)');
  const [preferredModality, setPreferredModality] = useState<'Face-to-Face' | 'Blended' | 'Modular'>('Face-to-Face');

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedApplication, setSubmittedApplication] = useState<EnrollmentApplication | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Automatically update age when birthdate changes
  useEffect(() => {
    if (birthdate) {
      const bDate = new Date(birthdate);
      const today = new Date();
      let diffAge = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        diffAge--;
      }
      if (!isNaN(diffAge) && diffAge >= 0) {
        setAge(diffAge);
      }
    }
  }, [birthdate]);

  // Compute grade levels permitted for enrollment at this school
  const enabledGrades = React.useMemo(() => {
    return getSchoolEnabledGrades(school);
  }, [school]);

  // Adjust tier based on grade level
  useEffect(() => {
    if (['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].includes(gradeLevel)) {
      setTier('ELEMENTARY');
    } else if (['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(gradeLevel)) {
      setTier('JUNIOR_HIGH');
    } else if (['Grade 11', 'Grade 12'].includes(gradeLevel)) {
      setTier('SENIOR_HIGH');
    }
  }, [gradeLevel]);

  // If the active school configuration does not offer the current gradeLevel, auto-adjust to first available
  useEffect(() => {
    if (enabledGrades.length > 0 && !enabledGrades.includes(gradeLevel)) {
      setGradeLevel(enabledGrades[0]);
    }
  }, [enabledGrades, gradeLevel]);

  // One-Click Real Data Pre-Fill Presets (No Placeholders)
  const applySample1 = () => {
    setGradeLevel('Grade 1');
    setLearnerType('NEW');
    setHasLrn(true);
    setLrn('109283749102');
    setPsaBirthCertNo('1029384756-PSA-2019');
    setLastName('Bautista');
    setFirstName('Mateo');
    setMiddleName('Santos');
    setExtensionName('');
    setBirthdate('2019-08-14');
    setAge(6);
    setSex('Male');
    setMotherTongue('Tagalog');
    setIs4ps(false);
    setHousehold4psId('');
    setIsIpCommunity(false);
    setHouseNo('Lot 14 Blk 3');
    setStreet('Mabini Street');
    setBarangay('Sawat');
    setMunicipalityCity('Urbiztondo');
    setProvince('Pangasinan');
    setLastSchoolAttended('Sawat Barangay Day Care Center');
    setLastSchoolId('105942');
    setLastGradeCompleted('Kindergarten');
    setLastSchoolYearCompleted('2025-2026');
    setFatherName('Eduardo Bautista');
    setFatherContact('+639178821101');
    setMotherName('Lourdes Santos-Bautista');
    setMotherContact('+639178821102');
    setPrimarySmsPhone('+639178821102');
    setEmergencyContact('Lourdes Santos-Bautista (+639178821102)');
  };

  const applySample2 = () => {
    setGradeLevel('Kindergarten');
    setLearnerType('NEW');
    setHasLrn(false);
    setLrn('');
    setPsaBirthCertNo('1029384756-PSA-2020');
    setLastName('Dizon');
    setFirstName('Althea Mae');
    setMiddleName('Gomez');
    setExtensionName('');
    setBirthdate('2020-10-05');
    setAge(5);
    setSex('Female');
    setMotherTongue('Ilokano');
    setIs4ps(true);
    setHousehold4psId('4PS-R01-PANG-77401');
    setIsIpCommunity(false);
    setHouseNo('Zone 2');
    setStreet('Rizal Extension');
    setBarangay('Sawat');
    setMunicipalityCity('Urbiztondo');
    setProvince('Pangasinan');
    setLastSchoolAttended('None');
    setLastSchoolId('');
    setLastGradeCompleted('None');
    setLastSchoolYearCompleted('');
    setFatherName('Ramon Dizon');
    setFatherContact('+639185521990');
    setMotherName('Jennifer Gomez-Dizon');
    setMotherContact('+639185521991');
    setPrimarySmsPhone('+639185521991');
    setEmergencyContact('Jennifer Gomez-Dizon (+639185521991)');
  };

  const applySample3 = () => {
    const targetGrade = enabledGrades.includes('Grade 7') ? 'Grade 7' : (enabledGrades[enabledGrades.length - 1] || 'Grade 6');
    setGradeLevel(targetGrade);
    setLearnerType('TRANSFEREE');
    setHasLrn(true);
    setLrn('109283747712');
    setPsaBirthCertNo('1029384756-PSA-2013');
    setLastName('Santos');
    setFirstName('Gabriel');
    setMiddleName('Navarro');
    setExtensionName('Jr.');
    setBirthdate('2013-11-18');
    setAge(12);
    setSex('Male');
    setMotherTongue('Tagalog');
    setIs4ps(false);
    setHousehold4psId('');
    setIsIpCommunity(false);
    setHouseNo('Block 5 Lot 12');
    setStreet('Del Pilar Boulevard');
    setBarangay('Mabini');
    setMunicipalityCity('Urbiztondo');
    setProvince('Pangasinan');
    setLastSchoolAttended('Sawat Elementary School');
    setLastSchoolId('105942');
    setLastGradeCompleted('Grade 6');
    setLastSchoolYearCompleted('2025-2026');
    setFatherName('Gabriel Santos Sr.');
    setFatherContact('+639171124455');
    setMotherName('Elena Navarro-Santos');
    setMotherContact('+639171124456');
    setPrimarySmsPhone('+639171124455');
    setEmergencyContact('Gabriel Santos Sr. (+639171124455)');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      if (!lastName.trim() || !firstName.trim()) {
        throw new Error('Please enter learner last name and first name.');
      }
      if (!primarySmsPhone.trim()) {
        throw new Error('Please provide a parent/guardian mobile number for automated attendance alerts.');
      }

      const payload: Partial<EnrollmentApplication> = {
        school_id: school.id,
        school_name: school.name,
        school_year: '2026-2027',
        grade_level: gradeLevel,
        tier,
        track: tier === 'SENIOR_HIGH' ? track : undefined,
        strand: tier === 'SENIOR_HIGH' ? strand : undefined,
        learner_type: learnerType,
        has_lrn: hasLrn,
        lrn: hasLrn ? lrn.trim() : undefined,
        psa_birth_cert_no: psaBirthCertNo.trim(),
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        extension_name: extensionName.trim(),
        birthdate,
        age,
        sex,
        mother_tongue: motherTongue,
        ip_community: isIpCommunity ? ipCommunity : undefined,
        is_4ps_beneficiary: is4ps,
        household_4ps_id: is4ps ? household4psId : undefined,
        has_disability: hasDisability,
        disability_details: hasDisability ? disabilityDetails : undefined,
        current_house_no: houseNo,
        current_street: street,
        current_barangay: barangay,
        current_municipality_city: municipalityCity,
        current_province: province,
        current_region: region,
        last_school_attended: lastSchoolAttended,
        last_school_id: lastSchoolId,
        last_grade_level_completed: lastGradeCompleted,
        last_school_year_completed: lastSchoolYearCompleted,
        father_name: fatherName,
        father_contact: fatherContact,
        mother_name: motherName,
        mother_contact: motherContact,
        guardian_name: guardianName,
        guardian_relationship: guardianRelationship,
        guardian_contact: guardianContact,
        primary_sms_phone: primarySmsPhone,
        emergency_contact: emergencyContact,
        preferred_modality: preferredModality,
      };

      const res = await enrollmentApi.submit(payload);
      setSubmittedApplication(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to submit enrollment. Please check the required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & TENANT BRANDING                                  */}
      {/* ------------------------------------------------------------- */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Link href="/" className="flex items-center space-x-2 focus:outline-none">
              <IdentifyLogo size="sm" showSubtitle={false} />
            </Link>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 p-1 flex items-center justify-center shrink-0">
                <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>{school.name}</span>
                  <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30">
                    ID: {school.deped_school_id}
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">Official DepEd Basic Education Online Enrollment Portal (SY 2026-2027)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/login"
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium border border-slate-700 transition-colors"
            >
              Faculty & Staff Sign In
            </Link>
            <Link
              href="/kiosk"
              className="text-xs px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/30 transition-colors"
            >
              Gate Kiosk (/kiosk)
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                             */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {submittedApplication ? (
          /* ========================================================= */
          /* SUBMISSION SUCCESS CONFIRMATION SLIP                      */
          /* ========================================================= */
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block mb-2">
              Official DepEd Application Logged
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Enrollment Form Successfully Submitted!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-lg mx-auto leading-relaxed">
              Your DepEd Basic Education Enrollment Form (BEEF) has been transmitted to the admissions queue of{' '}
              <span className="text-white font-bold">{submittedApplication.school_name}</span>. School faculty will review your
              credentials, confirm PSA/LRN verification, and assign your section.
            </p>

            {/* Tracking Reference Slip Card */}
            <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-left font-sans shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Official DepEd Reference Code</span>
                  <div className="text-xl font-mono font-black text-yellow-400 tracking-wider">
                    {submittedApplication.tracking_number}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white p-1 rounded-lg shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      submittedApplication.tracking_number
                    )}`}
                    alt="Tracking QR"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Enrollee Full Name</span>
                  <span className="text-white font-bold">
                    {submittedApplication.last_name}, {submittedApplication.first_name} {submittedApplication.middle_name} {submittedApplication.extension_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Target Grade Level</span>
                  <span className="text-cyan-400 font-bold font-mono">
                    {submittedApplication.grade_level} {submittedApplication.strand ? `(${submittedApplication.strand})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">School Year</span>
                  <span className="text-slate-300 font-mono font-medium">{submittedApplication.school_year}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">PSA Birth Certificate / LRN</span>
                  <span className="text-slate-300 font-mono">
                    {submittedApplication.lrn || submittedApplication.psa_birth_cert_no || 'Document in Process'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Primary Contact for Turnstile SMS</span>
                  <span className="text-slate-300 font-mono font-semibold">{submittedApplication.primary_sms_phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Admissions Review Status</span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" /> PENDING FACULTY ASSIGNMENT
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Please screenshot or print this slip. When approved, this record is automatically inserted into the official DepEd Student Database with RFID card activation.
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Print Official Enrollment Slip</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedApplication(null);
                  applySample1();
                }}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Submit Another Learner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* ONLINE ENROLLMENT FORM                                    */
          /* ========================================================= */
          <div className="space-y-6">
            {/* Banner & Real Data Evaluation Presets */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 inline-block mb-1">
                  Public DepEd BEEF Portal
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  DepEd Basic Education Enrollment Form (BEEF)
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Compliant with DepEd Order No. 03, s. 2018 (Basic Education Enrollment Policy). Open to new enrollees, transferees, and kindergarten applicants.
                </p>
              </div>

              {/* Instant 1-Click Evaluation Buttons with REAL Philippine data */}
              <div className="shrink-0 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>1-Click Real Sample Records:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={applySample1}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 font-medium transition-colors"
                  >
                    Grade 1 (Mateo)
                  </button>
                  <button
                    type="button"
                    onClick={applySample2}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 font-medium transition-colors"
                  >
                    Kinder (Althea Mae)
                  </button>
                  <button
                    type="button"
                    onClick={applySample3}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-medium transition-colors"
                  >
                    Grade 7 Transferee (Gabriel)
                  </button>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: TARGET GRADE & ENROLLMENT TYPE */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Target School & Grade Level</h3>
                    <p className="text-[11px] text-slate-400">Institutional selection and curriculum placement</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Target School Tenant</label>
                    <select
                      value={school.id}
                      onChange={(e) => {
                        const matched = availableSchools.find((s) => s.id === e.target.value);
                        if (matched) setSchool(matched);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      {availableSchools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (ID: {s.deped_school_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold block">Grade Level Applying For</label>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                        {school?.school_type === 'ELEMENTARY' && 'Elementary Only (K-6)'}
                        {school?.school_type === 'HIGH_SCHOOL' && 'High School Only (7-12)'}
                        {school?.school_type === 'INTEGRATED' && 'Integrated School (K-12)'}
                        {school?.school_type === 'CUSTOM' && `${enabledGrades.length} Active Grades`}
                        {!school?.school_type && `${enabledGrades.length} Grades Offered`}
                      </span>
                    </div>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      {enabledGrades.map((g) => {
                        let subLabel = '';
                        if (g === 'Kindergarten') subLabel = ' (Early Childhood - Age 5)';
                        else if (['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(g)) subLabel = ' (Junior High)';
                        else if (['Grade 11', 'Grade 12'].includes(g)) subLabel = ' (Senior High)';
                        return (
                          <option key={g} value={g}>
                            {g}{subLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Learner Category</label>
                    <select
                      value={learnerType}
                      onChange={(e) => setLearnerType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="NEW">New Enrollee / First-Time</option>
                      <option value="RETURNING">Returning / Balik-Aral</option>
                      <option value="TRANSFEREE">Transferee from Other School</option>
                    </select>
                  </div>
                </div>

                {/* If Senior High: Track and Strand */}
                {tier === 'SENIOR_HIGH' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">SHS Track</label>
                      <select
                        value={track}
                        onChange={(e) => setTrack(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="Academic">Academic Track</option>
                        <option value="TVL">Technical-Vocational-Livelihood (TVL)</option>
                        <option value="Arts & Design">Arts & Design Track</option>
                        <option value="Sports">Sports Track</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">SHS Strand</label>
                      <select
                        value={strand}
                        onChange={(e) => setStrand(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="STEM">Science, Technology, Engineering & Mathematics (STEM)</option>
                        <option value="ABM">Accountancy, Business and Management (ABM)</option>
                        <option value="HUMSS">Humanities and Social Sciences (HUMSS)</option>
                        <option value="GAS">General Academic Strand (GAS)</option>
                        <option value="ICT">Information and Communications Technology (ICT)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: LEARNER INFORMATION */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Learner Personal Details</h3>
                    <p className="text-[11px] text-slate-400">PSA Birth Certificate & LRN verification</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="text-slate-300 font-semibold block mb-1.5">Learner Reference Number (LRN) Status</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="lrnChoice"
                          checked={hasLrn}
                          onChange={() => setHasLrn(true)}
                          className="accent-blue-600"
                        />
                        <span>With 12-digit LRN</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="lrnChoice"
                          checked={!hasLrn}
                          onChange={() => setHasLrn(false)}
                          className="accent-blue-600"
                        />
                        <span>No LRN yet (Kinder / New)</span>
                      </label>
                    </div>
                    {hasLrn && (
                      <input
                        type="text"
                        maxLength={12}
                        value={lrn}
                        onChange={(e) => setLrn(e.target.value.replace(/\D/g, ''))}
                        placeholder="12-digit LRN (e.g. 109283749102)"
                        className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="text-slate-300 font-semibold block mb-1">PSA Birth Certificate Registry No.</label>
                    <input
                      type="text"
                      value={psaBirthCertNo}
                      onChange={(e) => setPsaBirthCertNo(e.target.value)}
                      placeholder="e.g. 1029384756-PSA-2019"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Found at upper right of PSA Certificate</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Bautista"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Mateo"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="e.g. Santos"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Extension (Jr, III)</label>
                    <input
                      type="text"
                      value={extensionName}
                      onChange={(e) => setExtensionName(e.target.value)}
                      placeholder="Jr., III (Optional)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Birthdate *</label>
                    <input
                      type="date"
                      required
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Age</label>
                    <input
                      type="number"
                      readOnly
                      value={age}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Sex *</label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Mother Tongue *</label>
                    <select
                      value={motherTongue}
                      onChange={(e) => setMotherTongue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Tagalog">Tagalog</option>
                      <option value="Ilokano">Ilokano</option>
                      <option value="Kapampangan">Kapampangan</option>
                      <option value="Pangasinan">Pangasinan</option>
                      <option value="Cebuano">Cebuano</option>
                      <option value="Bikolano">Bikolano</option>
                      <option value="Waray">Waray</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>

                {/* Socioeconomic & 4Ps Indicators */}
                <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={is4ps}
                        onChange={(e) => setIs4ps(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      <span className="font-semibold text-slate-300">Pantawid Pamilyang Pilipino Program (4Ps) Beneficiary</span>
                    </label>
                    {is4ps && (
                      <input
                        type="text"
                        value={household4psId}
                        onChange={(e) => setHousehold4psId(e.target.value)}
                        placeholder="4Ps Household ID Number (e.g. 4PS-R01-PANG-77401)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={isIpCommunity}
                        onChange={(e) => setIsIpCommunity(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      <span className="font-semibold text-slate-300">Belongs to Indigenous Peoples (IP) Community</span>
                    </label>
                    {isIpCommunity && (
                      <input
                        type="text"
                        value={ipCommunity}
                        onChange={(e) => setIpCommunity(e.target.value)}
                        placeholder="Specify IP Community (e.g. Aeta Magbukun)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: RESIDENTIAL ADDRESS */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Residential Address</h3>
                    <p className="text-[11px] text-slate-400">Current permanent or temporary residence</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">House No. / Street</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Mabini Street"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Barangay *</label>
                    <input
                      type="text"
                      required
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      placeholder="e.g. Sawat"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Municipality / City *</label>
                    <input
                      type="text"
                      required
                      value={municipalityCity}
                      onChange={(e) => setMunicipalityCity(e.target.value)}
                      placeholder="e.g. Urbiztondo"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Province *</label>
                    <input
                      type="text"
                      required
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="e.g. Pangasinan"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 font-semibold block mb-1">Region *</label>
                    <input
                      type="text"
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Region I - Ilocos Region"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PARENT / GUARDIAN & SMS ALERTS */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Parent / Guardian &amp; SMS Turnstile Contact</h3>
                    <p className="text-[11px] text-slate-400">Mobile phone receives automated RFID arrival &amp; dismissal SMS notices</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                  <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-bold block text-[11px]">Father's Details</span>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Father's Full Name</label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="e.g. Eduardo Bautista"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Father's Contact Number</label>
                      <input
                        type="text"
                        value={fatherContact}
                        onChange={(e) => setFatherContact(e.target.value)}
                        placeholder="+639178821101"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-bold block text-[11px]">Mother's Details (Maiden Name)</span>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Mother's Full Maiden Name</label>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="e.g. Lourdes Santos"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Mother's Contact Number</label>
                      <input
                        type="text"
                        value={motherContact}
                        onChange={(e) => setMotherContact(e.target.value)}
                        placeholder="+639178821102"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Automated SMS Recipient */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/60 text-xs">
                  <div className="flex items-center gap-2 mb-2 text-blue-300 font-bold">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Primary Mobile Phone for Automated Attendance SMS Alerts *</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-3">
                    Every time the learner scans their RFID card at the gate turnstiles, an instant DepEd safety notice will be dispatched to this number.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        value={primarySmsPhone}
                        onChange={(e) => setPrimarySmsPhone(e.target.value)}
                        placeholder="+639178821102 or 09178821102"
                        className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-sm tracking-wider"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Emergency Contact Name &amp; Relation"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: LEARNING MODALITY & AFFIRMATION */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Preferred Learning Modality &amp; Affirmation</h3>
                    <p className="text-[11px] text-slate-400">Classroom structure and legal DepEd statement</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-5">
                  {(['Face-to-Face', 'Blended', 'Modular'] as const).map((m) => (
                    <label
                      key={m}
                      onClick={() => setPreferredModality(m)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        preferredModality === m
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{m} Learning</span>
                      {preferredModality === m && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </label>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed mb-6">
                  <p className="font-semibold text-slate-300 mb-1">DepEd Legal Certification &amp; Data Privacy Statement:</p>
                  I hereby certify that the above information given is true and correct to the best of my knowledge, and I allow the Department of Education to use my child’s details for official Basic Education Enrollment Form (BEEF) purposes in compliance with the Data Privacy Act of 2012.
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Link
                    href="/"
                    className="py-3 px-5 rounded-2xl text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{submitting ? 'Transmitting to Admissions...' : 'Submit Official DepEd Enrollment Form'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>iDentify &bull; Philippine Department of Education (DepEd) SaaS Platform</p>
        <p className="text-[11px] text-slate-600 mt-1">Autonomous Turnstile Kiosk, RFID Gate Sync &amp; BEEF Database</p>
      </footer>
    </div>
  );
}
