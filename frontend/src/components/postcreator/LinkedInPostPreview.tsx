interface Props {
  text: string;
  authorName?: string | null;
  authorHeadline?: string | null;
  authorImage?: string | null;
  followersCount?: number | null;
}

export default function LinkedInPostPreview({
  text,
  authorName,
  authorHeadline,
  authorImage,
  followersCount,
}: Props) {
  const MAX_CHARS = 210;
  const isTruncated = text.length > MAX_CHARS;
  const displayText = isTruncated ? text.substring(0, MAX_CHARS) : text;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-lg mx-auto font-['Helvetica_Neue',Arial,sans-serif]">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start gap-2">
          {authorImage ? (
            <img
              src={authorImage}
              alt=""
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
              {(authorName || '?')[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-semibold text-[#000000e6] truncate">
                {authorName || 'Your Name'}
              </span>
              <span className="text-[12px] text-[#00000099]">· 1st</span>
            </div>
            <p className="text-[12px] text-[#00000099] leading-tight truncate">
              {authorHeadline || 'Your headline'}
            </p>
            <p className="text-[12px] text-[#00000099] mt-0.5">
              {followersCount && followersCount > 0
                ? `${followersCount.toLocaleString()} followers`
                : 'Now'}
              {' · '}
              <span title="Earth">🌐</span>
            </p>
          </div>
          <button className="text-[#00000099] hover:bg-gray-100 rounded-full p-1 text-xl leading-none">
            ⋯
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-[14px] text-[#000000e6] whitespace-pre-line leading-[1.4]">
          {displayText}
          {isTruncated && (
            <>
              ...{' '}
              <span className="text-[#00000099] hover:text-[#0a66c2] cursor-pointer">
                see more
              </span>
            </>
          )}
        </p>
      </div>

      {/* Reactions bar (placeholder) */}
      <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-1 text-[12px] text-[#00000099]">
        <span className="flex -space-x-1">
          <span className="w-4 h-4 rounded-full bg-[#0a66c2] border border-white flex items-center justify-center text-white text-[9px]">
            👍
          </span>
          <span className="w-4 h-4 rounded-full bg-[#df704d] border border-white flex items-center justify-center text-white text-[9px]">
            ❤
          </span>
        </span>
        <span className="ml-1">42</span>
        <span className="ml-auto">3 comments · 1 repost</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-around py-1 border-t border-gray-200 text-[#00000099]">
        {['👍 Like', '💬 Comment', '🔁 Repost', '📤 Send'].map((action) => (
          <button
            key={action}
            className="flex-1 py-2 text-[13px] font-semibold hover:bg-gray-100 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
