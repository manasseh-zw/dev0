import * as React from 'react'

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Width of the logo. Defaults to "auto".
   */
  width?: string | number
  /**
   * Height of the logo. Defaults to 40.
   */
  height?: string | number
}

/**
 * Dev0 Logo - Full logo with "dev0" text
 */
export const Logo = React.forwardRef<SVGSVGElement, LogoProps>(
  ({ width = 'auto', height = 40, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox="0 0 752 265"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <g transform="matrix(1,0,0,1,-1009,-645.645833)">
          <g transform="matrix(1,0,0,1,-223,-35)">
            <text
              x="1232px"
              y="944.2px"
              style={{
                fontFamily: "'SKA_cubic01_75_CE'",
                fontSize: '300px',
                fill: 'currentColor',
              }}
            >
              dev
            </text>
            <g transform="matrix(300,0,0,300,2019.5,944.2)" />
            <text
              x="1794.5px"
              y="944.2px"
              style={{
                fontFamily: "'SKA_cubic01_75_CE'",
                fontSize: '300px',
                stroke: 'currentColor',
                strokeWidth: '2.71px',
                fill: 'currentColor',
              }}
            >
              0
            </text>
          </g>
          <g transform="matrix(2.305205,0,0,2.310492,-830.045126,28.424796)">
            <clipPath id="logo-clip">
              <rect x="1045.856" y="270.225" width="61.011" height="97.919" />
            </clipPath>
            <g clipPath="url(#logo-clip)">
              <g transform="matrix(196.842536,0,0,196.842536,1131.723926,393)" />
              <text
                x="1021px"
                y="393px"
                style={{
                  fontFamily: "'1Bit'",
                  fontWeight: 500,
                  fontSize: '196.843px',
                  fill: 'currentColor',
                }}
              >
                0
              </text>
              <path
                fill="currentColor"
                d="M1119.421,380.697L1033.303,380.697L1033.303,257.671L1119.421,257.671L1119.421,380.697ZM1057.908,282.276L1045.605,282.276L1045.605,368.395L1094.816,368.395L1094.816,343.789L1082.513,343.789L1082.513,319.184L1070.211,319.184L1070.211,306.881L1057.908,306.881L1057.908,282.276ZM1094.816,343.789L1107.119,343.789L1107.119,269.973L1057.908,269.973L1057.908,282.276L1070.211,282.276L1070.211,294.579L1082.513,294.579L1082.513,319.184L1094.816,319.184L1094.816,343.789ZM1112.191,351.003L1102.046,351.003L1102.046,373.484L1107.119,373.484L1112.191,373.484L1112.191,351.003ZM1040.533,275.063L1050.678,275.063L1050.678,264.884L1045.605,264.884L1040.533,264.884L1040.533,275.063Z"
              />
            </g>
          </g>
        </g>
      </svg>
    )
  },
)

Logo.displayName = 'Logo'

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Size of the icon (width and height). Defaults to 24.
   */
  size?: string | number
  /**
   * Width of the icon. Overrides size if provided.
   */
  width?: string | number
  /**
   * Height of the icon. Overrides size if provided.
   */
  height?: string | number
}

/**
 * Dev0 Icon - Just the stylized "0" icon
 */
export const LogoIcon = React.forwardRef<SVGSVGElement, LogoIconProps>(
  ({ size = 24, width, height, className, ...props }, ref) => {
    const computedWidth = width ?? size
    const computedHeight = height ?? size

    return (
      <svg
        ref={ref}
        width={computedWidth}
        height={computedHeight}
        viewBox="0 0 190 265"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <g transform="matrix(1,0,0,1,-1007.645833,-645.645833)">
          <g transform="matrix(1,0,0,1,-223,-35)">
            <g transform="matrix(300,0,0,300,1457,944.2)" />
            <text
              x="1232px"
              y="944.2px"
              style={{
                fontFamily: "'SKA_cubic01_75_CE'",
                fontSize: '300px',
                stroke: 'currentColor',
                strokeWidth: '2.71px',
                fill: 'currentColor',
              }}
            >
              0
            </text>
          </g>
          <g transform="matrix(2.387158,0,0,2.392632,-1480.755675,2.206882)">
            <clipPath id="icon-clip">
              <rect x="1045.856" y="270.225" width="61.011" height="97.919" />
            </clipPath>
            <g clipPath="url(#icon-clip)">
              <g transform="matrix(196.842536,0,0,196.842536,1131.723926,393)" />
              <text
                x="1021px"
                y="393px"
                style={{
                  fontFamily: "'1Bit'",
                  fontWeight: 500,
                  fontSize: '196.843px',
                  fill: 'currentColor',
                }}
              >
                0
              </text>
              <path
                fill="currentColor"
                d="M1119.421,380.697L1033.303,380.697L1033.303,257.671L1119.421,257.671L1119.421,380.697ZM1057.908,282.276L1045.605,282.276L1045.605,368.395L1094.816,368.395L1094.816,343.789L1082.513,343.789L1082.513,319.184L1070.211,319.184L1070.211,306.881L1057.908,306.881L1057.908,282.276ZM1094.816,343.789L1107.119,343.789L1107.119,269.973L1057.908,269.973L1057.908,282.276L1070.211,282.276L1070.211,294.579L1082.513,294.579L1082.513,319.184L1094.816,319.184L1094.816,343.789ZM1040.284,275.31L1050.926,275.31L1050.926,264.637L1045.605,264.637L1040.284,264.637L1040.284,275.31ZM1112.439,350.755L1101.798,350.755L1101.798,373.732L1107.119,373.732L1112.439,373.732L1112.439,350.755Z"
              />
            </g>
          </g>
        </g>
      </svg>
    )
  },
)

LogoIcon.displayName = 'LogoIcon'

/**
 * LogoShowcase - A component to demonstrate both Logo and LogoIcon
 */
export const LogoShowcase: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        padding: '2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <Logo height={64} />
        <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>Full Logo</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <LogoIcon size={64} />
        <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>Icon Only</span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          marginTop: '1rem',
        }}
      >
        <LogoIcon size={24} />
        <LogoIcon size={32} />
        <LogoIcon size={48} />
        <LogoIcon size={64} />
      </div>
    </div>
  )
}
