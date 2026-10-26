export default function () {
    return (
      <>
        <header className="h-[57px] bg-white border-b border-[#e5e5e5] flex items-center justify-center">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-6 h-6 text-gray-800"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 8h6m-6 4h6m-6 4h6M6 3v18l2-2 2 2 2-2 2 2 2-2 2 2V3l-2 2-2-2-2 2-2-2-2 2-2-2Z"
              ></path>
            </svg>

            <span className="text-[15px] font-normal">InvoiceApp</span>
          </div>
        </header>
      </>
    );
}