@extends('layouts.app')
@section('title', 'Team — Vaulx')

@section('content')

@php
    // Team data — kept inline for now since it's static and small. Move to
    // config/database when bios/photos start changing per-environment.
    // Source of truth for these fields: vaulx.fi/#team (LinkedIn URLs,
    // emails, refined bio length). Synced 2026-05-11.
    $team = [
        [
            'name' => 'George Dimitrov',
            'role' => 'CEO / CTO',
            'location' => 'Vienna, Austria',
            'flags' => ['🇦🇹', '🇲🇩'],
            'bio' => '15+ years in European banking operations. Corporate execution, legal and regulatory alignment.',
            'tags' => ['Banking', 'Regulation'],
            'email' => 'george@vaulx.fi',
            'linkedin' => 'https://www.linkedin.com/in/gheorghedimitrov/',
        ],
        [
            'name' => 'Marcelo Coelho',
            'role' => 'Chief Operations',
            'location' => 'São Paulo, Brazil',
            'flags' => ['🇧🇷'],
            'bio' => 'Deep experience in physical security business. 15+ years in Brazilian electronic-security infra business.',
            'tags' => ['Security', 'Custody'],
            'email' => 'marcelo@vaulx.fi',
            'linkedin' => 'https://www.linkedin.com/in/marcelo-coelho-78564236/',
        ],
        [
            'name' => 'Rodrigo Coelho',
            'role' => 'Chief Growth',
            'location' => 'São Paulo, Brazil',
            'flags' => ['🇧🇷'],
            'bio' => 'Institutional network, market entry, and commercial partnerships across Brazil and LATAM.',
            'tags' => ['Business network', 'LATAM'],
            'email' => 'rodrigo@vaulx.fi',
            'linkedin' => 'https://www.linkedin.com/in/rodrigo-coelho-2459a123/',
        ],
        [
            'name' => 'Edson Pohren',
            'role' => 'Senior Engineer',
            'location' => 'São Paulo, Brazil',
            'flags' => ['🇧🇷'],
            'bio' => 'Anchor, Bubblegum, oracle integration. Ensures the on-chain stack is solid.',
            'tags' => ['Solana', 'Anchor'],
            'email' => 'edson@vaulx.fi',
            'linkedin' => 'https://www.linkedin.com/in/edson-pohren-19421ab5/',
        ],
        [
            'name' => 'Felipe Veloso',
            'role' => 'DeFi Advisor & Community',
            'location' => 'USA / Brazil',
            'flags' => ['🇺🇸', '🇧🇷'],
            'bio' => 'DeFi founder (4p.finance). US/BR DeFi network. São Paulo luxury watch market and fiat-crypto rails.',
            'tags' => ['DeFi', 'Distribution'],
            'email' => 'felipe@vaulx.fi',
            'linkedin' => 'https://www.linkedin.com/in/felipealveloso/',
        ],
    ];
@endphp

<style>
    /* Page-scoped: 5-column grid that wraps cleanly down to 1 column on mobile.
       Bootstrap col-* doesn't natively split into 5 equal cells, hence CSS grid. */
    .team-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    @media (min-width: 640px)  { .team-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 992px)  { .team-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1280px) { .team-grid { grid-template-columns: repeat(5, 1fr); } }

    .team-card {
        background: var(--vx-surface);
        border: 1px solid var(--vx-border);
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
    }
    .team-card .top-strip {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--vx-text-muted);
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1.5px solid var(--vx-teal, #0E7C7B);
    }
    .team-card .top-strip .flags { font-size: 16px; letter-spacing: 0; }
    .team-card .avatar-wrap { text-align: center; margin-bottom: 18px; }
    .team-card .name {
        text-align: center;
        font-family: 'Outfit', system-ui, sans-serif;
        font-weight: 700;
        font-size: 19px;
        letter-spacing: -0.025em;
        color: var(--vx-text);
        margin: 0 0 4px;
    }
    .team-card .role {
        text-align: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.10em;
        text-transform: uppercase;
        color: var(--vx-teal, #0E7C7B);
        margin: 0 0 16px;
    }
    .team-card .bio {
        font-size: 13px;
        line-height: 1.55;
        color: var(--vx-text-muted);
        margin: 0 0 14px;
    }
    .team-card .tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 14px;
    }
    .team-card .tags .tag {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 9px;
        font-weight: 500;
        letter-spacing: 0.10em;
        text-transform: uppercase;
        color: var(--vx-text-muted);
        padding: 3px 7px;
        border: 1px solid var(--vx-border);
    }
    .team-card .contact {
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid var(--vx-border-soft, rgba(10,10,11,.06));
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .team-card .contact a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        color: var(--vx-text-muted);
        text-decoration: none;
        border: 1px solid var(--vx-border);
        transition: color .15s ease, border-color .15s ease;
    }
    .team-card .contact a:hover {
        color: var(--vx-teal, #0E7C7B);
        border-color: var(--vx-teal, #0E7C7B);
    }
    .team-card .contact a i { font-size: 14px; }

    .team-callout {
        margin-top: 48px;
        padding: 22px 28px;
        background: rgba(43, 160, 158, 0.06);
        border-left: 3px solid var(--vx-teal, #0E7C7B);
    }
    .team-callout .label {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--vx-teal, #0E7C7B);
        margin: 0 0 4px;
    }
    .team-callout .text {
        font-size: 14px;
        color: var(--vx-text);
        margin: 0;
    }

    .team-strip {
        margin-top: 16px;
        padding: 16px 24px;
        background: var(--vx-text);
        color: var(--vx-bg);
        text-align: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }
    .team-strip .dot {
        display: inline-block;
        margin: 0 0.5em;
        color: var(--vx-teal, #0E7C7B);
    }
</style>

<section class="py-5" style="background:var(--vx-bg)">
    <div class="container py-4">

        {{-- HEADER --}}
        <p class="pitch-line mb-3" style="display:inline-block;padding:.4rem 1.1rem;border:1px solid var(--vx-border-soft);border-radius:999px">
            <span style="color:var(--vx-accent-mark)">●</span>
            <span class="ms-2">08 · Team</span>
        </p>
        <h1 class="mb-3 fw-bold" style="font-size:clamp(2.2rem, 5vw, 3.8rem); line-height:1.05; letter-spacing:-0.025em; max-width:18ch; color:var(--vx-text)">
            Executives, operators, builders, and market <em class="vx-italic">access</em>.
        </h1>
        <p class="lead text-muted mb-5" style="max-width:60ch">
            The team combines banking, security infrastructure, business network, Solana engineering, and live DeFi distribution.
        </p>

        {{-- 5 CARDS --}}
        <div class="team-grid">
            @foreach($team as $member)
                <div class="team-card">
                    <div class="top-strip">
                        <span>{{ $member['location'] }}</span>
                        <span class="flags">{!! implode(' ', $member['flags']) !!}</span>
                    </div>
                    <div class="avatar-wrap">
                        <x-avatar-initials :name="$member['name']" :size="96" color="#0E7C7B" />
                    </div>
                    <div class="name">{{ $member['name'] }}</div>
                    <div class="role">{{ $member['role'] }}</div>
                    <p class="bio">{{ $member['bio'] }}</p>
                    @if(!empty($member['tags']))
                        <div class="tags">
                            @foreach($member['tags'] as $tag)
                                <span class="tag">{{ $tag }}</span>
                            @endforeach
                        </div>
                    @endif
                    <div class="contact">
                        @if(!empty($member['linkedin']))
                            <a href="{{ $member['linkedin'] }}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn — {{ $member['name'] }}">
                                <i class="bi bi-linkedin"></i>
                            </a>
                        @endif
                        @if(!empty($member['email']))
                            <a href="mailto:{{ $member['email'] }}" aria-label="Email — {{ $member['name'] }}">
                                <i class="bi bi-envelope-fill"></i>
                            </a>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>

        {{-- SOFTER CALLOUT (replaces the deck's "NO COMPETITOR..." line) --}}
        <div class="team-callout">
            <p class="label">Five non-overlapping axes</p>
            <p class="text">Active commercial conversations with licensed custodians, appraisers, curators, and LP partners across Brazil, LATAM, and the US.</p>
        </div>

        {{-- BOTTOM CATEGORY STRIP --}}
        <div class="team-strip">
            Banking <span class="dot">·</span> Security <span class="dot">·</span> Business Network <span class="dot">·</span> Solana <span class="dot">·</span> DeFi
        </div>

    </div>
</section>

@endsection
