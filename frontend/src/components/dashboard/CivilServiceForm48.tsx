'use client';

import React from 'react';
import { MonthlyDtrReport } from '@/lib/api';

interface CivilServiceForm48Props {
  report: MonthlyDtrReport;
  formatType?: 'EHRIS' | 'SARAH';
  compact?: boolean;
}

/**
 * DepEd Civil Service Form No. 48 (CS Form 48) Daily Time Record
 * Supports official DepEd eHRIS (Self-Service) and DepEd SARAH (Biometrics) formats
 * with full teacher profile (Employee Number, Plantilla Item Number, Position, Salary Grade, Station, School ID).
 */
export default function CivilServiceForm48({
  report,
  formatType = 'EHRIS',
  compact = false,
}: CivilServiceForm48Props) {
  const isSarah = formatType === 'SARAH';

  return (
    <div className="bg-white text-black font-serif p-5 sm:p-7 max-w-[620px] mx-auto border-2 border-black shadow-md rounded-none cs-form-48-page print:m-0 print:border-black print:shadow-none print:max-w-none print:w-full">
      {/* ============================================================= */}
      {/* HEADER SECTION (EHRIS vs SARAH)                               */}
      {/* ============================================================= */}
      {isSarah ? (
        /* ---------------- SARAH FORMAT HEADER ---------------- */
        <div className="text-center leading-tight mb-3 border-b-2 border-black pb-2">
          <div className="text-[9px] uppercase tracking-wider font-sans font-bold text-gray-700 print:text-black">
            Republic of the Philippines &bull; Department of Education
          </div>
          <div className="text-[10px] font-sans font-black tracking-wide text-gray-900 print:text-black uppercase mt-0.5">
            SARAH (Standard Automated Recording of Attendance Host)
          </div>
          <div className="text-[8.5px] font-mono text-gray-600 print:text-black">
            Biometric Attendance Management System &bull; Host Terminal v4.8 &bull; Gate Turnstiles
          </div>

          <div className="mt-2 text-center">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider font-sans border-t border-b border-black py-0.5 inline-block px-6">
              Civil Service Form No. 48 &bull; Daily Time Record
            </h2>
          </div>

          {/* SARAH Individual Teacher Metadata Box */}
          <div className="mt-2.5 text-left font-sans text-[9.5px] bg-gray-50 print:bg-transparent border border-black p-2 space-y-1">
            <div className="grid grid-cols-12 gap-1.5">
              <div className="col-span-7">
                <span className="text-gray-600 print:text-black font-semibold">Personnel Name:</span>{' '}
                <span className="font-bold uppercase text-[10.5px] text-black underline decoration-black">
                  {report.userName}
                </span>
              </div>
              <div className="col-span-5 text-right font-mono">
                <span className="text-gray-600 print:text-black font-sans font-semibold">RFID Tag:</span>{' '}
                <span className="font-bold bg-gray-200 print:bg-transparent px-1 rounded border border-gray-400 print:border-none">
                  {report.rfidTag || 'UNASSIGNED'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 pt-1 border-t border-gray-300">
              <div className="col-span-6">
                <span className="text-gray-600 print:text-black">Employee No:</span>{' '}
                <span className="font-mono font-bold">{report.employeeNumber}</span>
              </div>
              <div className="col-span-6 text-right">
                <span className="text-gray-600 print:text-black">Plantilla Item:</span>{' '}
                <span className="font-mono font-bold">{report.plantillaItemNo}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5">
              <div className="col-span-7">
                <span className="text-gray-600 print:text-black">Position:</span>{' '}
                <span className="font-semibold">{report.position}</span> ({report.salaryGrade})
              </div>
              <div className="col-span-5 text-right">
                <span className="text-gray-600 print:text-black">Station:</span>{' '}
                <span className="font-medium truncate">{report.station}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 pt-1 border-t border-gray-300">
              <div className="col-span-6">
                <span className="text-gray-600 print:text-black">Period:</span>{' '}
                <span className="font-bold underline uppercase">{report.monthName} {report.year}</span>
              </div>
              <div className="col-span-6 text-right">
                <span className="text-gray-600 print:text-black">Official Schedule:</span>{' '}
                <span className="font-semibold">{report.officialHoursRegular}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ---------------- DEPED EHRIS FORMAT HEADER ---------------- */
        <div className="text-center leading-tight mb-3 border-b-2 border-black pb-2">
          {/* Official DepEd Header */}
          <div className="flex items-center justify-between border-b border-gray-400 pb-1.5 mb-1.5">
            <div className="text-left font-sans text-[8.5px] leading-tight text-gray-700 print:text-black">
              <div className="font-bold uppercase tracking-wide">Republic of the Philippines</div>
              <div className="font-black text-[9.5px] text-black">DEPARTMENT OF EDUCATION</div>
              <div>{report.division} &bull; {report.region}</div>
            </div>
            <div className="text-right font-sans text-[8.5px] leading-tight">
              <div className="px-2 py-0.5 bg-blue-50 print:bg-transparent border border-blue-400 print:border-black rounded text-blue-900 print:text-black font-bold uppercase tracking-wider text-[8px]">
                DepEd eHRIS Verified
              </div>
              <div className="font-mono text-[7.5px] text-gray-500 print:text-black mt-0.5">
                Ref: {report.systemRefId}
              </div>
            </div>
          </div>

          <div className="text-[10px] tracking-wider uppercase font-sans font-bold text-gray-800 print:text-black">
            Enterprise Human Resource Information System (eHRIS)
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider font-sans mt-0.5">
            Civil Service Form No. 48 &bull; Daily Time Record
          </h2>
          <div className="text-[9px] italic font-sans text-gray-600 print:text-black">
            (Electronic Biometric DTR Generated via eHRIS Self-Service Portal)
          </div>

          {/* eHRIS Comprehensive Personnel Information Card */}
          <div className="mt-2 text-left font-sans text-[9.5px] border border-black p-2 bg-slate-50/50 print:bg-transparent space-y-1">
            <div className="flex justify-between items-baseline border-b border-gray-300 pb-1">
              <div>
                <span className="text-gray-600 print:text-black font-semibold">Employee Name:</span>{' '}
                <span className="font-black text-xs uppercase underline decoration-black ml-1">
                  {report.userName}
                </span>
              </div>
              <div className="font-mono text-[9px]">
                <span className="text-gray-600 print:text-black font-sans">eHRIS Employee No:</span>{' '}
                <span className="font-bold text-black">{report.employeeNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 pt-0.5">
              <div className="col-span-6">
                <span className="text-gray-600 print:text-black font-semibold">Plantilla Item No:</span>{' '}
                <span className="font-mono font-bold text-black">{report.plantillaItemNo}</span>
              </div>
              <div className="col-span-6 text-right">
                <span className="text-gray-600 print:text-black font-semibold">Salary Grade / Status:</span>{' '}
                <span className="font-bold">{report.salaryGrade}</span> ({report.employmentStatus})
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 pt-0.5">
              <div className="col-span-7">
                <span className="text-gray-600 print:text-black font-semibold">Position:</span>{' '}
                <span className="font-semibold">{report.position}</span>
              </div>
              <div className="col-span-5 text-right font-mono text-[9px]">
                <span className="text-gray-600 print:text-black font-sans">Turnstile RFID UID:</span>{' '}
                <span className="font-bold">{report.rfidTag || 'None'}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 pt-0.5 border-t border-gray-300">
              <div className="col-span-7">
                <span className="text-gray-600 print:text-black font-semibold">Station / School:</span>{' '}
                <span className="font-medium">{report.station}</span> (ID: {report.schoolId})
              </div>
              <div className="col-span-5 text-right">
                <span className="text-gray-600 print:text-black font-semibold">Month:</span>{' '}
                <span className="font-bold underline uppercase">{report.monthName} {report.year}</span>
              </div>
            </div>

            <div className="pt-0.5 flex justify-between items-center text-[9px] text-gray-700 print:text-black">
              <span>Official Hours: <strong>{report.officialHoursRegular}</strong> (Saturdays: {report.officialHoursSaturday})</span>
              <span className="font-mono text-[8px] text-gray-500 print:text-black">{report.depedEmail}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CSC FORM NO. 48 DAYS 1 TO 31 TABLE GRID                      */}
      {/* ============================================================= */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-center text-[10px] font-sans leading-none">
          <thead>
            <tr className="border-b border-black bg-gray-50 print:bg-transparent font-bold">
              <th rowSpan={2} className="border-r border-black p-1 w-8 text-[9px] align-middle">
                Day
              </th>
              <th colSpan={2} className="border-r border-black p-1 text-[10px]">
                A. M.
              </th>
              <th colSpan={2} className="border-r border-black p-1 text-[10px]">
                P. M.
              </th>
              <th colSpan={2} className="p-1 text-[9px]">
                Undertime
              </th>
            </tr>
            <tr className="border-b-2 border-black bg-gray-50 print:bg-transparent text-[8.5px] font-semibold">
              <th className="border-r border-black p-1 w-16">Arrival</th>
              <th className="border-r border-black p-1 w-16">Departure</th>
              <th className="border-r border-black p-1 w-16">Arrival</th>
              <th className="border-r border-black p-1 w-16">Departure</th>
              <th className="border-r border-black p-1 w-10">Hours</th>
              <th className="p-1 w-10">Minutes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/60 font-mono text-[9.5px]">
            {report.days.map((d) => {
              const isSat = d.isSaturday;
              const isSun = d.isSunday;

              return (
                <tr
                  key={d.day}
                  className={`h-5 ${
                    isSat || isSun
                      ? 'bg-gray-100/70 print:bg-gray-100/40 font-bold'
                      : d.amArrival
                      ? 'hover:bg-blue-50/40 print:hover:bg-transparent'
                      : ''
                  }`}
                >
                  <td className="border-r border-black p-0.5 text-center font-bold">
                    {d.day}
                  </td>

                  {/* Weekend Span */}
                  {isSat ? (
                    <td
                      colSpan={4}
                      className="border-r border-black p-0.5 tracking-widest text-[9px] uppercase font-sans font-bold text-gray-700 print:text-black"
                    >
                      {d.amArrival ? `${d.amArrival} - ${d.pmDeparture || d.amDeparture} (DUTY)` : 'SATURDAY'}
                    </td>
                  ) : isSun ? (
                    <td
                      colSpan={4}
                      className="border-r border-black p-0.5 tracking-widest text-[9px] uppercase font-sans font-bold text-gray-700 print:text-black"
                    >
                      {d.amArrival ? `${d.amArrival} - ${d.pmDeparture || d.amDeparture} (DUTY)` : 'SUNDAY'}
                    </td>
                  ) : (
                    <>
                      <td className="border-r border-black p-0.5">
                        {d.amArrival || ''}
                      </td>
                      <td className="border-r border-black p-0.5">
                        {d.amDeparture || ''}
                      </td>
                      <td className="border-r border-black p-0.5">
                        {d.pmArrival || ''}
                      </td>
                      <td className="border-r border-black p-0.5">
                        {d.pmDeparture || ''}
                      </td>
                    </>
                  )}

                  {/* Undertime Hours & Minutes */}
                  <td className="border-r border-black p-0.5 text-center">
                    {d.undertimeHours > 0 ? d.undertimeHours : ''}
                  </td>
                  <td className="p-0.5 text-center">
                    {d.undertimeMinutes > 0 ? d.undertimeMinutes : ''}
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="border-t-2 border-black font-bold text-[10px] bg-gray-50 print:bg-transparent font-sans">
              <td colSpan={5} className="border-r border-black p-1.5 text-right uppercase tracking-wider">
                Total Undertime
              </td>
              <td className="border-r border-black p-1.5 font-mono text-center">
                {report.totalUndertimeHours > 0 ? report.totalUndertimeHours : '0'}
              </td>
              <td className="p-1.5 font-mono text-center">
                {report.totalUndertimeMinutes > 0 ? report.totalUndertimeMinutes : '0'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Chips */}
      <div className="mt-2 flex items-center justify-between text-[9.5px] font-sans text-gray-600 print:text-black border-b border-gray-300 pb-1.5">
        <span>Rendered Days of Duty: <strong className="text-black">{report.totalDaysPresent} Days</strong></span>
        <span>
          Total Undertime / Tardiness:{' '}
          <strong className="text-black">
            {report.totalUndertimeHours} hr{report.totalUndertimeHours !== 1 ? 's' : ''}{' '}
            {report.totalUndertimeMinutes} min{report.totalUndertimeMinutes !== 1 ? 's' : ''}
          </strong>
        </span>
        {isSarah ? (
          <span className="font-mono text-[8.5px]">Terminal: SARAH-01</span>
        ) : (
          <span className="font-mono text-[8.5px]">eHRIS Status: RECORDED</span>
        )}
      </div>

      {/* ============================================================= */}
      {/* OFFICIAL CERTIFICATION & VERIFICATION SIGNATURES              */}
      {/* ============================================================= */}
      <div className="mt-3.5 text-justify text-[9.5px] font-sans leading-tight">
        <p className="italic">
          I certify on my honor that the above is a true and correct report of the hours of work performed,
          record of which was made daily at the time of arrival and departure from office.
        </p>

        {/* Employee Signature */}
        <div className="mt-5 text-center">
          <div className="border-b border-black w-60 mx-auto pb-0.5 font-bold uppercase text-[10.5px]">
            {report.userName}
          </div>
          <div className="text-[8.5px] font-medium text-gray-700 print:text-black mt-0.5">
            {report.position} &bull; Emp No: {report.employeeNumber}
          </div>
          <div className="text-[8px] italic text-gray-500 print:text-black">
            (Signature of Employee)
          </div>
        </div>

        {/* In-Charge / Principal Verification */}
        <div className="mt-4">
          <div className="text-[9.5px] italic">Verified as to the prescribed office hours:</div>
          <div className="mt-5 text-center">
            <div className="border-b border-black w-60 mx-auto pb-0.5 font-bold uppercase text-[10.5px]">
              {report.principalName}
            </div>
            <div className="text-[8.5px] font-medium text-gray-800 print:text-black mt-0.5">
              {report.principalTitle || 'Principal I / School Head'}
            </div>
            <div className="text-[8px] italic text-gray-600 print:text-black">
              In Charge / Immediate Supervisor
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SYSTEM VERIFICATION STAMP & BARCODE FOOTER                    */}
      {/* ============================================================= */}
      <div className="mt-4 pt-2 border-t border-gray-400 font-sans text-[8px] text-gray-600 print:text-black flex items-center justify-between">
        {isSarah ? (
          <>
            <div>
              <div className="font-mono font-bold text-gray-900 print:text-black">
                [SARAH BIOMETRIC LOGS HOST CLIENT &bull; DEVICE SYNC VERIFIED]
              </div>
              <div className="text-[7.5px]">
                Turnstile Machine #1 &bull; SHA256 Checksum: {report.systemRefId} &bull; RA 10173 Protected
              </div>
            </div>
            <div className="font-mono text-right text-[8px] border border-black px-1.5 py-0.5">
              SARAH v4.8 &bull; SYNCED
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="font-mono font-bold text-gray-900 print:text-black">
                [DEPED eHRIS SYSTEM GENERATED DOCUMENT &bull; VERIFICATION CODE: {report.systemRefId}]
              </div>
              <div className="text-[7.5px]">
                Conforms with Civil Service Commission Form No. 48 &bull; DepEd Order No. 8, s. 2015 &bull; Electronic ePDS Integrated
              </div>
            </div>
            <div className="font-mono text-right text-[8px] border border-black px-1.5 py-0.5 bg-gray-50 print:bg-transparent">
              eHRIS REF: {report.employeeNumber}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
