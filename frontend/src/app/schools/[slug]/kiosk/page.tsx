'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { apiClient } from '@/lib/api';
import KioskPage from '@/app/kiosk/page';

export default function TenantSpecificKioskPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { setSchool } = useTenant();

  useEffect(() => {
    if (slug) {
      apiClient.getSchoolBySlug(slug).then((res) => {
        if (res) setSchool(res);
      });
    }
  }, [slug, setSchool]);

  return <KioskPage />;
}
