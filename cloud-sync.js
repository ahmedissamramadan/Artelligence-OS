/**
 * Artelligence OS <-> Supabase Unified Cloud Sync Bridge
 * Connects macOS Desktop & Web OS View to the live Artelligence Supabase Core.
 */
(function () {
  const SUPABASE_URL = 'https://owlglaqltdniywcprzab.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGdsYXFsdGRuaXl3Y3ByemFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzNTY2NDgsImV4cCI6MjExMDkzMjY0OH0._Y7iR4YU7z10-TOkRHSYC_466_5pJ3mFSYjRqGgbWGo';

  async function sbGet(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    return res.ok ? res.json() : [];
  }

  async function syncCloudPanel() {
    try {
      const [cases, notes, cols, offers] = await Promise.all([
        sbGet('case_studies?select=id,title_ar,anon_title_ar,is_anonymized&is_published=eq.true&order=sort_order'),
        sbGet('mind_notes?select=id,category,title_ar&is_published=eq.true&order=sort_order'),
        sbGet('collections?select=id,title_ar&is_published=eq.true'),
        sbGet('services_offers?select=id,title_ar,price_egp_label&is_active=eq.true&order=step_order')
      ]);

      const badge = document.getElementById('backend-status-badge');
      if (badge) {
        badge.textContent = `Supabase Cloud: متصل (${cases.length} أدلة · ${cols.length} مجموعات)`;
      }

      const cmdTab = document.getElementById('tab-command-center');
      if (!cmdTab) return;

      let panel = document.getElementById('artelligence-live-cloud-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'artelligence-live-cloud-panel';
        panel.style.cssText = 'margin:16px 0 24px;padding:20px;border-radius:16px;background:#0A0A0A;border:1px solid #27272A;color:#FFFFFF;';
        const welcome = cmdTab.querySelector('.welcome-banner');
        if (welcome && welcome.nextSibling) cmdTab.insertBefore(panel, welcome.nextSibling);
        else cmdTab.prepend(panel);
      }

      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div>
            <div style="font-size:0.75rem;color:#A1A1AA;letter-spacing:0.08em;font-weight:700;">ARTELLIGENCE UNIFIED SUPABASE CORE · LIVE</div>
            <h3 style="margin:4px 0 0;font-size:1.15rem;">المزامنة الحية مع المنصة الموحدة وتطبيق الأندرويد</h3>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="https://ahmedissamramadan.github.io/" target="_blank" rel="noopener" style="padding:7px 14px;border-radius:999px;background:#FFFFFF;color:#0A0A0A;font-size:0.8rem;font-weight:700;text-decoration:none;">فتح المنصة الأم ↗</a>
            <a href="https://ahmedissamramadan.github.io/studio/" target="_blank" rel="noopener" style="padding:7px 14px;border-radius:999px;border:1px solid #27272A;background:#141416;color:#FFFFFF;font-size:0.8rem;text-decoration:none;">فتح مركز القيادة والـ CRM ↗</a>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px;">
          <div style="padding:12px;border-radius:12px;background:#141416;border:1px solid #27272A;">
            <div style="font-size:0.75rem;color:#A1A1AA;">سُلّم Growth OS</div>
            <div style="font-size:1.3rem;font-weight:700;">${offers.length} درجات نشطة</div>
          </div>
          <div style="padding:12px;border-radius:12px;background:#141416;border:1px solid #27272A;">
            <div style="font-size:0.75rem;color:#A1A1AA;">خزينة الأدلة الموثقة</div>
            <div style="font-size:1.3rem;font-weight:700;">${cases.length} دراسات حالة</div>
          </div>
          <div style="padding:12px;border-radius:12px;background:#141416;border:1px solid #27272A;">
            <div style="font-size:0.75rem;color:#A1A1AA;">تدوينات داخل عقلي</div>
            <div style="font-size:1.3rem;font-weight:700;">${notes.length} تدوينات حية</div>
          </div>
          <div style="padding:12px;border-radius:12px;background:#141416;border:1px solid #27272A;">
            <div style="font-size:0.75rem;color:#A1A1AA;">المتحف البصري</div>
            <div style="font-size:1.3rem;font-weight:700;">${cols.length} مجموعات</div>
          </div>
        </div>
        <div style="font-size:0.82rem;color:#A1A1AA;">
          آخر التدوينات المتزامنة: ${notes.slice(0, 3).map(n => `<strong style="color:#FFF;">${n.title_ar}</strong>`).join(' · ')}
        </div>
      `;
    } catch (err) {
      console.warn('Cloud sync warning:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncCloudPanel);
  } else {
    syncCloudPanel();
  }
  document.getElementById('btn-refresh')?.addEventListener('click', syncCloudPanel);
})();
