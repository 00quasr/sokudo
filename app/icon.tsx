import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0b',
          borderRadius: '6px',
        }}
      >
        {/* Stylized "S" for Sokudo with speed effect */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speed symbol - stylized "S" */}
          <path
            d="M 10 12 Q 10 8 14 8 L 18 8 Q 22 8 22 12 Q 22 14 20 15 L 16 16 Q 12 17 12 20 Q 12 24 16 24 L 18 24 Q 22 24 22 20"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Motion lines for speed effect */}
          <line
            x1="6"
            y1="10"
            x2="8"
            y2="10"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="5"
            y1="16"
            x2="9"
            y2="16"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="6"
            y1="22"
            x2="8"
            y2="22"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
