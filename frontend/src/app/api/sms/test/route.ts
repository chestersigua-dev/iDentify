import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      provider = 'EASYSMS',
      recipient = '+639171234567',
      message = '[iDentify DepEd Notice] Test SMS broadcast: Gate RFID turnstile gateway is active.',
      apiKey,
      senderName = 'iDentify',
    } = body;

    // Normalize recipient number to standard Philippine mobile format
    let cleanPhone = String(recipient || '').replace(/[^0-9+]/g, '');
    let easysmsPhone = cleanPhone;
    if (easysmsPhone.startsWith('09')) {
      easysmsPhone = '63' + easysmsPhone.slice(1);
    } else if (easysmsPhone.startsWith('+63')) {
      easysmsPhone = easysmsPhone.slice(1);
    }

    const selectedProvider = String(provider).toUpperCase();

    // 1. EASYSMS (Easy Send SMS - https://restapi.easysendsms.app/v1/rest/sms/send)
    if (selectedProvider === 'EASYSMS') {
      const activeKey = apiKey || process.env.EASYSMS_API_KEY || process.env.EASYSENDSMS_API_KEY;

      if (!activeKey || activeKey.includes('***') || activeKey.startsWith('mock_')) {
        return NextResponse.json({
          success: true,
          provider: 'EASYSMS',
          status: 'SENT',
          mode: 'MOCK_SIMULATED',
          message: 'Test SMS simulated successfully (using mock EasySMS credentials).',
          providerMessageId: `easysms-sim-${Date.now()}`,
          recipient: easysmsPhone,
          text: message,
          from: senderName,
          endpoint: 'https://restapi.easysendsms.app/v1/rest/sms/send',
          timestamp: new Date().toISOString(),
          details: {
            note: 'To dispatch live carrier SMS, provide your real EasySendSMS API Key from https://my.easysendsms.app/api_references',
          },
        });
      }

      // Live dispatch to EasySendSMS REST API
      const response = await fetch('https://restapi.easysendsms.app/v1/rest/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': activeKey,
        },
        body: JSON.stringify({
          from: senderName || 'iDentify',
          to: easysmsPhone,
          text: message,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            provider: 'EASYSMS',
            status: 'FAILED',
            statusCode: response.status,
            error: responseData?.Description || responseData?.message || responseData?.error || `HTTP ${response.status}`,
            raw: responseData,
            recipient: easysmsPhone,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        provider: 'EASYSMS',
        status: 'SENT',
        statusCode: response.status,
        providerMessageId:
          responseData?.message_id || responseData?.id || responseData?.batch_id || 'easysms-live-ok',
        recipient: easysmsPhone,
        text: message,
        raw: responseData,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. SEMAPHORE PH (https://api.semaphore.co/api/v4/messages)
    if (selectedProvider === 'SEMAPHORE') {
      const activeKey = apiKey || process.env.SEMAPHORE_API_KEY;
      if (!activeKey || activeKey.includes('***') || activeKey.startsWith('mock_')) {
        return NextResponse.json({
          success: true,
          provider: 'SEMAPHORE',
          status: 'SENT',
          mode: 'MOCK_SIMULATED',
          providerMessageId: `semaphore-sim-${Date.now()}`,
          recipient: cleanPhone,
          text: message,
          timestamp: new Date().toISOString(),
        });
      }

      const response = await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: activeKey,
          number: cleanPhone,
          message,
          sendername: senderName,
        }),
      });

      const responseData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: response.ok,
        provider: 'SEMAPHORE',
        status: response.ok ? 'SENT' : 'FAILED',
        providerMessageId: Array.isArray(responseData) ? responseData[0]?.message_id : 'sem-ack',
        raw: responseData,
        recipient: cleanPhone,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. PHILSMS (https://dashboard.philsms.com/api/v3/sms/send)
    if (selectedProvider === 'PHILSMS') {
      const token = apiKey || process.env.PHILSMS_API_TOKEN;
      if (!token || token.includes('***') || token.startsWith('mock_')) {
        return NextResponse.json({
          success: true,
          provider: 'PHILSMS',
          status: 'SENT',
          mode: 'MOCK_SIMULATED',
          providerMessageId: `philsms-sim-${Date.now()}`,
          recipient: cleanPhone,
          text: message,
          timestamp: new Date().toISOString(),
        });
      }

      const response = await fetch('https://dashboard.philsms.com/api/v3/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: cleanPhone,
          sender_id: senderName,
          type: 'plain',
          message,
        }),
      });

      const responseData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: response.ok,
        provider: 'PHILSMS',
        status: responseData?.status === 'success' ? 'SENT' : 'FAILED',
        providerMessageId: responseData?.data?.uid,
        raw: responseData,
        recipient: cleanPhone,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Default / Mock Fallback
    return NextResponse.json({
      success: true,
      provider: 'MOCK',
      status: 'SENT',
      providerMessageId: `mock-msg-${Date.now()}`,
      recipient: cleanPhone,
      text: message,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error while sending SMS',
      },
      { status: 500 }
    );
  }
}
