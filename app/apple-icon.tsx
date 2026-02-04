import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: '36px',
        }}
      >
        {/* Stylized "S" for Sokudo with speed effect - scaled for larger icon */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speed symbol - stylized "S" */}
          <path
            d="M 56 67.5 Q 56 45 78.75 45 L 101.25 45 Q 123.75 45 123.75 67.5 Q 123.75 78.75 112.5 84.375 L 90 90 Q 67.5 95.625 67.5 112.5 Q 67.5 135 90 135 L 101.25 135 Q 123.75 135 123.75 112.5"
            stroke="#22c55e"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          {/* Motion lines for speed effect */}
          <line
            x1="33.75"
            y1="56.25"
            x2="45"
            y2="56.25"
            stroke="#a1a1aa"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="28.125"
            y1="90"
            x2="50.625"
            y2="90"
            stroke="#a1a1aa"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="33.75"
            y1="123.75"
            x2="45"
            y2="123.75"
            stroke="#a1a1aa"
            strokeWidth="8"
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
