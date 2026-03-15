import React, { useEffect, useRef } from 'react';

export default function IconGenerator({ keyword, onIconsGenerated }) {
    // prevent multiple query for API
    const requestingKeywordRef = useRef(null);

    useEffect(() => {
        // check keyword
        if (!keyword || !onIconsGenerated) return;
        if (requestingKeywordRef.current === keyword) return;
        
        // lock current keyword
        requestingKeywordRef.current = keyword;

        const generate = async () => {
            try {
                const res = await fetch('/api/icon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keyword }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Icon generation failed');
                }

                const data = await res.json();
                if (!data.imageBase64) {
                    throw new Error("No image data received from API.");
                }

                console.log(`[IconGen] Success for "${keyword}".`);
                onIconsGenerated(data.imageBase64);

            } catch (err) {
                console.error(`[IconGen] Failed for "${keyword}":`, err);
                onIconsGenerated(null);
            }
        };

        generate();

    }, [keyword, onIconsGenerated]);

    // no DOM rendered
    return null;
}