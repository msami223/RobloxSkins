import React from 'react'

export default function Header() {
  return (
    <div className="z-10 flex h-[60px] px-6 items-center justify-between border-b border-border bg-background">
      <div className="flex items-center gap-4">
        {/* Logo Section */}
        <div className="flex w-[152px] cursor-pointer items-center justify-center">
          <div className="mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 1235 200"
              width="100%"
            >
              <g>
                <path
                  fill="#FF5D02"
                  d="M100 200c55.23 0 100-44.77 100-100S155.23 0 100 0 0 44.77 0 100s44.77 100 100 100Z"
                />
                <g filter="url(#a)">
                  <path
                    fill="#fff"
                    fillRule="evenodd"
                    d="M100 165c19.71 0 34.5-5.86 43.96-16 10.34-11.11 11.32-24.96 10.99-32.22-.7-15.06-6.98-23.95-12.02-31.1h-.01c-1.86-2.48-5.3-6.95-6.68-9.71-1.6-3.37-2.75-4.75-1.2-11.38 6.31-2 11.9-6.94 11.9-13.93 0-8.64-7-15.66-15.64-15.66-8.63 0-15.4 6.77-15.4 15.41 0 4.78 1.9 8.45 5.3 11.32a7.62 7.62 0 0 1-4.52 6.4c-6.5-1.68-13.41-1.97-16.68-2.02-3.27.03-10.18.34-16.68 2.01a7.64 7.64 0 0 1-4.52-6.4 14.18 14.18 0 0 0 5.3-11.31C84.1 41.77 77.32 35 68.7 35s-15.63 7-15.63 15.66c0 6.99 5.58 11.92 11.9 13.93 1.54 6.63.4 8.01-1.2 11.38-1.39 2.76-4.83 7.23-6.69 9.69-5.05 7.17-11.33 16.06-12.03 31.12-.33 7.26.65 21.1 11 32.21C65.5 159.14 80.28 165 100 165Z"
                    clipRule="evenodd"
                  />
                </g>
              </g>
              <path
                fill="currentColor"
                d="M293.4 156.99c-17.05 0-31.2-5.48-42.04-16.26C240.5 129.96 235 116.07 235 99.5c0-16.58 5.5-30.46 16.36-41.24C262.2 47.47 276.35 42 293.4 42c14.42 0 26.87 4.06 37 12.05 10.07 7.96 16.52 18.58 19.17 31.57h-26.15a29.66 29.66 0 0 0-11.46-14.05c-5.28-3.47-11.52-5.22-18.55-5.22-9.53 0-17.36 3.1-23.3 9.23-5.95 6.13-8.95 14.17-8.95 23.91 0 9.75 3.01 17.79 8.94 23.92 5.94 6.13 13.78 9.23 23.31 9.23 7.04 0 13.29-1.75 18.55-5.22a29.6 29.6 0 0 0 11.46-14.06h26.15c-2.65 13-9.09 23.6-19.18 31.58-10.12 8-22.56 12.05-37 12.05Zm114.24 0c-15.93 0-27.94-4.44-36.74-13.58-9.67-10.05-13.63-22.12-13.63-41.7V44.88h25.93v56.83c0 7.1.56 17.2 5.41 22.61 4.75 5.3 11.15 8 19.03 8 7.9 0 14.3-2.68 19.04-8 4.85-5.42 5.4-15.5 5.4-22.61V44.88h25.94v56.83c0 19.56-3.95 31.65-13.63 41.7-8.8 9.14-20.82 13.58-36.73 13.58h-.02Zm102.46 0c-13.56 0-24.6-3.32-32.8-9.84-8.2-6.48-12.5-14.94-12.82-25.14h26.15c.35 8.09 6.76 12.19 19.04 12.19 13.08 0 19.71-4.36 19.71-12.98 0-2.99-1.58-5.3-4.7-6.88-3.07-1.54-7-2.68-11.64-3.36l-15.07-2.23a72.04 72.04 0 0 1-15.1-3.85c-4.64-1.75-8.55-4.97-11.6-9.58-3.05-4.61-4.6-10.6-4.6-17.78 0-10.4 3.97-19.01 11.83-25.6 7.86-6.6 18.42-9.94 31.38-9.94 12.96 0 23.26 3.27 31.05 9.72 7.74 6.41 11.84 14.61 12.16 24.37h-25.7c-.33-3.37-2.01-6.12-5-8.17-3.02-2.07-7.07-3.13-12.07-3.13-5.57 0-9.93 1.11-12.94 3.32a10.58 10.58 0 0 0-4.56 8.95c0 2.88 1.6 5.15 4.75 6.72 3.12 1.57 7.07 2.72 11.71 3.44l15.07 2.33a72.12 72.12 0 0 1 15.06 3.98c4.61 1.81 8.5 5.09 11.53 9.75 3.04 4.66 4.58 10.7 4.58 17.93 0 10.4-4.2 19.05-12.49 25.72-8.3 6.66-19.37 10.06-32.93 10.06Zm166.2 0c-17.05 0-31.19-5.48-42.03-16.26-10.85-10.77-16.37-24.66-16.37-41.24 0-16.58 5.5-30.46 16.37-41.24C645.1 47.47 659.25 42 676.3 42c17.06 0 31.2 5.47 42.05 16.25 10.84 10.8 16.34 24.66 16.34 41.24 0 16.58-5.5 30.45-16.35 41.24-10.84 10.78-25 16.26-42.04 16.26Zm0-90.64c-9.52 0-17.36 3.1-23.3 9.23-5.93 6.13-8.95 14.17-8.95 23.91 0 9.75 3.02 17.79 8.95 23.92 5.93 6.13 13.78 9.23 23.3 9.23 9.53 0 17.33-3.1 23.2-9.23 5.86-6.13 8.83-14.17 8.83-23.92 0-9.74-2.97-17.78-8.84-23.91-5.86-6.13-13.67-9.23-23.19-9.23Zm205.43 87.75V91.75c0-8.56-2.01-15-5.98-19.15-3.96-4.14-9.4-6.24-16.15-6.24-6.75 0-11.96 2.13-15.93 6.35-3.96 4.22-5.97 10.62-5.97 19.04v62.37h-25.93V91.74c0-8.42-2.04-14.82-6.08-19.04-4.04-4.22-9.44-6.35-16.05-6.35-6.6 0-12.19 2.1-16.15 6.24-3.96 4.14-5.97 10.59-5.97 19.15v62.37h-25.93V91.74c0-16.3 4.21-28.79 12.5-37.14 8.3-8.36 19.37-12.6 32.92-12.6 16.6 0 29.14 6.47 37.3 19.23l.54.06c7.97-12.82 20.52-19.28 37.4-19.28 13.54 0 24.61 4.25 32.91 12.6 8.3 8.36 12.5 20.85 12.5 37.14v62.37h-25.92l-.01-.01Zm85.57 2.89c-15.93 0-27.94-4.44-36.74-13.58-9.68-10.05-13.63-22.12-13.63-41.7V44.88h25.93v56.83c0 7.1.56 17.2 5.41 22.61 4.75 5.3 11.15 8 19.03 8 7.89 0 14.29-2.68 19.04-8 4.84-5.42 5.4-15.5 5.4-22.61V44.88h25.93v56.83c0 19.56-3.95 31.65-13.62 41.7-8.8 9.14-20.82 13.58-36.75 13.58Zm101.5 0c-13.56 0-24.6-3.32-32.81-9.84-8.19-6.48-12.49-14.94-12.82-25.14h26.14c.35 8.09 6.77 12.19 19.05 12.19 13.07 0 19.7-4.36 19.7-12.98 0-2.99-1.57-5.3-4.69-6.88-3.07-1.54-7-2.68-11.65-3.36l-15.07-2.23a72.97 72.97 0 0 1-15.1-3.85c-4.64-1.75-8.55-4.97-11.6-9.58-3.05-4.61-4.6-10.6-4.6-17.78 0-10.4 3.98-19.01 11.84-25.6 7.86-6.6 18.42-9.94 31.37-9.94 12.96 0 23.26 3.27 31.05 9.72 7.75 6.41 11.84 14.61 12.17 24.37h-25.71c-.33-3.37-2.01-6.12-4.99-8.17-3.01-2.07-7.08-3.13-12.06-3.13-5.58 0-9.93 1.11-12.94 3.32a10.57 10.57 0 0 0-4.57 8.95c0 2.88 1.61 5.15 4.76 6.72 3.12 1.56 7.07 2.72 11.71 3.44l15.07 2.33a72.24 72.24 0 0 1 15.05 3.98c4.62 1.81 8.5 5.09 11.54 9.75 3.04 4.66 4.57 10.7 4.57 17.93 0 10.4-4.19 19.05-12.48 25.72-8.29 6.66-19.37 10.06-32.93 10.06Zm108.24 0c-17.05 0-31.19-5.48-42.04-16.26-10.84-10.77-16.34-24.66-16.34-41.24 0-16.58 5.5-30.46 16.34-41.24 10.85-10.78 25.01-16.25 42.04-16.25 17.04 0 30.94 5.47 41.72 16.25 10.78 10.8 16.24 24.66 16.24 41.24a9.16 9.16 0 0 1-9.11 9.18h-80v.58c1.76 7.41 5.41 13.33 10.83 17.61 5.42 4.29 12.25 6.46 20.32 6.46 11.72 0 20.42-3.52 25.85-10.46l27.65.05a52.1 52.1 0 0 1-20.23 24.8c-9.4 6.17-20.58 9.29-33.27 9.29v-.01Zm0-91.31c-7.62 0-14.15 1.91-19.43 5.67-5.28 3.77-9 9.13-11.06 15.91v.62h60.98v-.58c-2.06-6.68-5.81-12-11.17-15.85-5.36-3.83-11.86-5.78-19.33-5.78h.01Zm-563.39 2.88V44.88h-50.37v56.83c0 22.29 2.15 34.2 12.28 43.8 10.13 9.58 22.37 11.48 38.07 11.48v-24.66c-9.24 0-15.63-1.35-20.37-6.66-4.85-5.42-4.07-16.84-4.07-23.95V68.57h24.44l.02-.01Z"
              />
              <defs>
                <filter
                  id="a"
                  width="120"
                  height="140"
                  x="40"
                  y="32"
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    result="hardAlpha"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="2.5" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_701_6715"
                  />
                  <feBlend
                    in="SourceGraphic"
                    in2="effect1_dropShadow_701_6715"
                    result="shape"
                  />
                  <feColorMatrix
                    in="SourceAlpha"
                    result="hardAlpha"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  />
                  <feOffset dy="-3" />
                  <feGaussianBlur stdDeviation="3" />
                  <feComposite
                    in2="hardAlpha"
                    k2="-1"
                    k3="1"
                    operator="arithmetic"
                  />
                  <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend in2="shape" result="effect2_innerShadow_701_6715" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>

        {/* Navigation Button */}
        <button
          className="p-2 h-10 bg-transparent text-zinc-600 hover:bg-accent active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-accent dark:active:bg-zinc-700 inline-flex items-center text-center transition-all cursor-pointer rounded-xl relative max-w-full focus-visible:outline-4 focus-visible:outline-primary-new-200 disabled:cursor-not-allowed"
          type="button"
          style={{ width: 'auto', justifyContent: 'center' }}
        >
          <div
            className="flex transition-all overflow-hidden w-full"
            style={{ opacity: 1, justifyContent: 'center' }}
          >
            <div className="flex items-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.7474 5.66437C16.1143 5.25159 16.0771 4.61952 15.6644 4.2526C15.2516 3.88568 14.6195 3.92286 14.2526 4.33565L8.25259 11.3356C7.9158 11.7145 7.9158 12.2855 8.25259 12.6644L14.2526 19.6644C14.6195 20.0772 15.2516 20.1143 15.6644 19.7474C16.0771 19.3805 16.1143 18.7484 15.7474 18.3356L10.338 12L15.7474 5.66437Z"
                />
              </svg>
            </div>
            <div
              className="leading-4 overflow-hidden"
              style={{ padding: '4px 8px' }}
            >
              <div className="my-auto truncate text-center font-bold text-sm leading-4 transition-colors duration-200">
                <span className="m-0 font-plus-jakarta font-bold text-[12px] leading-[16px]">
                  <span className="m-0 font-plus-jakarta font-bold text-[14px] leading-[20px]">
                    Home
                  </span>
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Pro Button */}
        <button
          className="relative flex p-2 cursor-pointer whitespace-nowrap items-center justify-center transition-all duration-[0.2s] ease-[ease] text-foreground bg-muted hover:bg-accent active:bg-accent h-11 px-4 rounded-xl text-[13px] font-semibold w-fit"
          type="button"
        >
          <span className="text-nowrap flex w-fit items-center gap-2 justify-center relative z-[1] opacity-100 transition-opacity">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect width="24" height="24" rx="12" fill="#1F2937" />
              <path
                d="M12.3777 7.44662C12.3418 7.39316 12.2932 7.34936 12.2363 7.31907C12.1794 7.28879 12.116 7.27295 12.0515 7.27295C11.9871 7.27295 11.9236 7.28879 11.8668 7.31907C11.8099 7.34936 11.7613 7.39316 11.7253 7.44662L9.56954 10.6344L6.88275 8.84826C6.81721 8.80483 6.74017 8.78201 6.66155 8.78275C6.58293 8.78348 6.50633 8.80774 6.44161 8.85239C6.3769 8.89704 6.32704 8.96005 6.29844 9.03329C6.26985 9.10653 6.26384 9.18665 6.28118 9.26334L7.32025 13.8489C7.33993 13.9358 7.3885 14.0135 7.45804 14.0692C7.52757 14.1249 7.61395 14.1554 7.70306 14.1557H16.3984C16.4875 14.1553 16.5738 14.1248 16.6433 14.0691C16.7128 14.0134 16.7614 13.9357 16.7812 13.8489L17.8202 9.26334C17.8376 9.18665 17.8316 9.10653 17.803 9.03329C17.7744 8.96005 17.7245 8.89704 17.6598 8.85239C17.5951 8.80774 17.5185 8.78348 17.4399 8.78275C17.3613 8.78201 17.2842 8.80483 17.2187 8.84826L14.5341 10.6344L12.3777 7.44662Z"
                fill="#FFDD33"
              />
              <path
                d="M7.33333 16.0833C7.33333 15.7612 7.5945 15.5 7.91666 15.5H16.0833C16.4055 15.5 16.6667 15.7612 16.6667 16.0833C16.6667 16.4055 16.4055 16.6667 16.0833 16.6667H7.91666C7.5945 16.6667 7.33333 16.4055 7.33333 16.0833Z"
                fill="#FFDD33"
              />
            </svg>
            Try Pro
          </span>
        </button>

        {/* Title Input Section */}
        <div className="relative w-full">
          <button
            type="button"
            className="text-body-xs-regular block w-full truncate whitespace-pre rounded-lg border border-transparent px-2 py-1.5 text-left transition-all hover:cursor-text hover:border-border "
          >
            Blank Suit Roblox Classic
          </button>
          <input
            placeholder="Enter title"
            className="text-body-xs-regular block w-full rounded-lg border bg-background px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none border-border hidden"
            type="text"
            defaultValue="Blank Suit Roblox Classic"
          />
        </div>

        {/* Cloud/Sync Icon */}
        <div className="flex size-10 select-none items-center justify-center gap-1 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.65364 11.4172L4.75386 11.5783C3.05266 11.8828 1.76152 13.3721 1.76152 15.1605C1.76152 17.1704 3.39092 18.7998 5.40089 18.7998H18.5986C20.6086 18.7998 22.238 17.1704 22.238 15.1605C22.238 13.1505 20.6086 11.5211 18.5986 11.5211H17.5253L18.7237 10.3227C21.3386 10.3891 23.438 12.5296 23.438 15.1605C23.438 17.8332 21.2713 19.9998 18.5986 19.9998H5.40089C2.72818 19.9998 0.561523 17.8332 0.561523 15.1605C0.561523 12.7807 2.27921 10.8022 4.54239 10.397C4.85751 6.97031 7.73969 4.2868 11.2486 4.2868C13.6905 4.2868 15.8288 5.58631 17.0097 7.53148C16.9533 7.57453 16.8991 7.62183 16.8475 7.67339L16.1234 8.39757C15.1884 6.66467 13.3557 5.4868 11.2486 5.4868C8.36558 5.4868 5.99621 7.69204 5.73735 10.5069L5.65364 11.4172ZM18.4032 9.22903C18.6375 8.99471 18.6375 8.61482 18.4032 8.3805C18.1689 8.14619 17.789 8.14619 17.5546 8.3805L11.302 14.6332L9.12677 12.4583C8.89243 12.224 8.51253 12.2241 8.27824 12.4584C8.04394 12.6927 8.04398 13.0726 8.27831 13.3069L10.8778 15.906C11.1121 16.1402 11.492 16.1402 11.7263 15.9059L18.4032 9.22903Z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo Button */}
          <button
            className="inline-flex aspect-square cursor-pointer relative justify-center items-center p-1 flex-shrink-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-ring w-10 h-10 rounded-xl bg-transparent hover:bg-accent active:bg-accent"
            disabled
          >
            <div
              className="flex items-center transition-all duration-200 text-muted-foreground [&_svg]:fill-muted-foreground"
              style={{ opacity: 1 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M2.79683 7.84908C2.56252 8.08339 2.56252 8.46329 2.79683 8.6976L6.67329 12.5741C6.90761 12.8084 7.28751 12.8084 7.52182 12.5741C7.75614 12.3398 7.75614 11.9599 7.52182 11.7255L4.66965 8.87336H15.1139C17.9111 8.87336 20.1788 11.141 20.1788 13.9383C20.1788 16.7356 17.9111 19.0032 15.1139 19.0032H10.0787C9.74737 19.0032 9.47874 19.2718 9.47874 19.6032C9.47874 19.9346 9.74737 20.2032 10.0787 20.2032H15.1139C18.5739 20.2032 21.3788 17.3983 21.3788 13.9383C21.3788 10.4783 18.5739 7.67336 15.1139 7.67336H4.6696L7.52182 4.82114C7.75614 4.58682 7.75614 4.20693 7.52182 3.97261C7.28751 3.7383 6.90761 3.7383 6.67329 3.97261L2.79683 7.84908Z" />
              </svg>
            </div>
          </button>

          {/* Redo Button */}
          <button
            className="inline-flex aspect-square cursor-pointer relative justify-center items-center p-1 flex-shrink-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-ring w-10 h-10 rounded-xl bg-transparent hover:bg-accent active:bg-accent"
            disabled
          >
            <div
              className="flex items-center transition-all duration-200 text-muted-foreground [&_svg]:fill-muted-foreground"
              style={{ opacity: 1 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M21.2032 7.84908C21.4375 8.08339 21.4375 8.46329 21.2032 8.6976L17.3267 12.5741C17.0924 12.8084 16.7125 12.8084 16.4782 12.5741C16.2439 12.3398 16.2439 11.9599 16.4782 11.7255L19.3304 8.87336H8.88613C6.08886 8.87336 3.82122 11.141 3.82122 13.9383C3.82122 16.7356 6.08886 19.0032 8.88613 19.0032H13.9213C14.2526 19.0032 14.5213 19.2718 14.5213 19.6032C14.5213 19.9346 14.2526 20.2032 13.9213 20.2032H8.88613C5.42612 20.2032 2.62122 17.3983 2.62122 13.9383C2.62122 10.4783 5.42612 7.67336 8.88613 7.67336H19.3304L16.4782 4.82114C16.2439 4.58682 16.2439 4.20693 16.4782 3.97261C16.7125 3.7383 17.0924 3.7383 17.3267 3.97261L21.2032 7.84908Z" />
              </svg>
            </div>
          </button>
        </div>

        {/* Upload Button */}
        <button className="inline-flex aspect-square cursor-pointer relative justify-center items-center p-1 flex-shrink-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-ring w-10 h-10 rounded-xl bg-transparent hover:bg-accent active:bg-accent">
          <div
            className="flex items-center transition-all duration-200 text-muted-foreground [&_svg]:fill-muted-foreground"
            style={{ opacity: 1 }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#robloxUploadIcon)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M32.0299 14.7875L16.8379 10.7168L12.7672 25.9088L27.9592 29.9794L32.0299 14.7875ZM24.805 18.9579L21.007 17.9403L19.9893 21.7383L23.7873 22.7559L24.805 18.9579Z"
                />
                <path
                  d="M13.4344 17.7515C12.9657 17.2828 12.2059 17.2828 11.7373 17.7515L7.86085 21.6279C7.39222 22.0966 7.39222 22.8564 7.86085 23.325C8.32948 23.7936 9.08927 23.7936 9.5579 23.325L11.3843 21.4986V29.4091C11.3843 30.0718 11.9215 30.6091 12.5843 30.6091C13.247 30.6091 13.7843 30.0718 13.7843 29.4091V21.4955L15.6138 23.325C16.0824 23.7936 16.8422 23.7936 17.3108 23.325C17.7795 22.8564 17.7795 22.0966 17.3108 21.6279L13.4344 17.7515Z"
                  fill="#4B5563"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </g>
              <defs>
                <clipPath id="robloxUploadIcon">
                  <rect
                    width="24"
                    height="24"
                    fill="white"
                    transform="translate(8 8)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
        </button>

        {/* Share Button */}
        <button
          className="h-10 bg-[#FF5D02] hover:bg-[rgb(204,74,2)] active:bg-[#993801] disabled:bg-[#ffccaa] text-white inline-flex items-center text-center transition-all cursor-pointer rounded-xl relative max-w-full focus-visible:outline-4 focus-visible:outline-[#ffccaa] disabled:cursor-not-allowed"
          type="button"
          style={{ width: 'auto', justifyContent: 'center', padding: '10px' }}
        >
          <div className="w-full flex items-center justify-center">
            <div className="leading-4 overflow-hidden px-2">
              <span className="font-plus-jakarta font-bold text-[14px]">
                Share
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
