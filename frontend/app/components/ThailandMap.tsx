'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Camera {
    id: string;
    province_code: string;
    province_name: string;
    province_name_th: string;
    status: string;
}

interface ThailandMapProps {
    cameras: Camera[];
    onProvinceClick?: (provinceCode: string, camera?: Camera) => void;
    selectedProvince?: string;
}

const PROVINCES_TH: Record<string, string> = {
    "TH10": "กรุงเทพมหานคร",
    "TH11": "สมุทรปราการ",
    "TH12": "นนทบุรี",
    "TH13": "ปทุมธานี",
    "TH14": "พระนครศรีอยุธยา",
    "TH15": "อ่างทอง",
    "TH16": "ลพบุรี",
    "TH17": "สิงห์บุรี",
    "TH18": "ชัยนาท",
    "TH19": "สระบุรี",
    "TH20": "ชลบุรี",
    "TH21": "ระยอง",
    "TH22": "จันทบุรี",
    "TH23": "ตราด",
    "TH24": "ฉะเชิงเทรา",
    "TH25": "ปราจีนบุรี",
    "TH26": "นครนายก",
    "TH27": "สระแก้ว",
    "TH30": "นครราชสีมา",
    "TH31": "บุรีรัมย์",
    "TH32": "สุรินทร์",
    "TH33": "ศรีสะเกษ",
    "TH34": "อุบลราชธานี",
    "TH35": "ยโสธร",
    "TH36": "ชัยภูมิ",
    "TH37": "อำนาจเจริญ",
    "TH38": "บึงกาฬ",
    "TH39": "หนองบัวลำภู",
    "TH40": "ขอนแก่น",
    "TH41": "อุดรธานี",
    "TH42": "เลย",
    "TH43": "หนองคาย",
    "TH44": "มหาสารคาม",
    "TH45": "ร้อยเอ็ด",
    "TH46": "กาฬสินธุ์",
    "TH47": "สกลนคร",
    "TH48": "นครพนม",
    "TH49": "มุกดาหาร",
    "TH50": "เชียงใหม่",
    "TH51": "ลำพูน",
    "TH52": "ลำปาง",
    "TH53": "อุตรดิตถ์",
    "TH54": "แพร่",
    "TH55": "น่าน",
    "TH56": "พะเยา",
    "TH57": "เชียงราย",
    "TH58": "แม่ฮ่องสอน",
    "TH60": "นครสวรรค์",
    "TH61": "อุทัยธานี",
    "TH62": "กำแพงเพชร",
    "TH63": "ตาก",
    "TH64": "สุโขทัย",
    "TH65": "พิษณุโลก",
    "TH66": "พิจิตร",
    "TH67": "เพชรบูรณ์",
    "TH70": "ราชบุรี",
    "TH71": "กาญจนบุรี",
    "TH72": "สุพรรณบุรี",
    "TH73": "นครปฐม",
    "TH74": "สมุทรสาคร",
    "TH75": "สมุทรสงคราม",
    "TH76": "เพชรบุรี",
    "TH77": "ประจวบคีรีขันธ์",
    "TH80": "นครศรีธรรมราช",
    "TH81": "กระบี่",
    "TH82": "พังงา",
    "TH83": "ภูเก็ต",
    "TH84": "สุราษฎร์ธานี",
    "TH85": "ระนอง",
    "TH86": "ชุมพร",
    "TH90": "สงขลา",
    "TH91": "สตูล",
    "TH92": "ตรัง",
    "TH93": "พัทลุง",
    "TH94": "ปัตตานี",
    "TH95": "ยะลา",
    "TH96": "นราธิวาส",
    "THS": "พัทยา"
};

export default function ThailandMap({ cameras = [], onProvinceClick, selectedProvince }: ThailandMapProps) {
    const svgRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    // Get camera by province code
    const getCameraByProvince = (provinceCode: string): Camera | undefined => {
        return cameras.find(cam => cam.province_code === provinceCode);
    };

    // Load SVG
    useEffect(() => {
        fetch('/maps/th.svg')
            .then(res => res.text())
            .then(svg => {
                setSvgContent(svg);
            })
            .catch(err => console.error('Failed to load SVG:', err));
    }, []);

    // Add interactivity to SVG
    useEffect(() => {
        if (!svgRef.current || !svgContent) return;

        const container = svgRef.current;
        const paths = container.querySelectorAll('path[id]');

        paths.forEach((path) => {
            const provinceCode = path.getAttribute('id');
            if (!provinceCode) return;

            const camera = getCameraByProvince(provinceCode);
            const hasCamera = !!camera;
            const isActive = camera?.status === 'active';

            // Set base styles
            (path as SVGPathElement).style.cursor = 'pointer';
            (path as SVGPathElement).style.transition = 'all 0.3s ease';

            // Set fill based on camera status
            if (hasCamera) {
                (path as SVGPathElement).style.fill = isActive ? '#22c55e' : '#f59e0b';
                (path as SVGPathElement).style.stroke = '#fff';
                (path as SVGPathElement).style.strokeWidth = '2';
            } else if (provinceCode === selectedProvince) {
                (path as SVGPathElement).style.fill = '#3b82f6';
            }

            // Mouse events
            path.addEventListener('mouseenter', (e) => {
                setHoveredProvince(provinceCode);
                (path as SVGPathElement).style.fill = hasCamera
                    ? (isActive ? '#16a34a' : '#d97706')
                    : '#3b82f6';
                (path as SVGPathElement).style.transform = 'scale(1.02)';
                (path as SVGPathElement).style.transformOrigin = 'center';

                const rect = (e.target as Element).getBoundingClientRect();
                const provinceName = PROVINCES_TH[provinceCode] || provinceCode;
                let content = provinceName;
                if (hasCamera) {
                    content += ` (📷 ${isActive ? 'ทำงาน' : 'ไม่ทำงาน'})`;
                }
                setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                    content
                });
            });

            path.addEventListener('mouseleave', () => {
                setHoveredProvince(null);
                setTooltip(null);
                if (hasCamera) {
                    (path as SVGPathElement).style.fill = isActive ? '#22c55e' : '#f59e0b';
                } else if (provinceCode === selectedProvince) {
                    (path as SVGPathElement).style.fill = '#3b82f6';
                } else {
                    (path as SVGPathElement).style.fill = '#6f9c76';
                }
                (path as SVGPathElement).style.transform = 'scale(1)';
            });

            path.addEventListener('click', () => {
                if (onProvinceClick) {
                    onProvinceClick(provinceCode, camera);
                }
            });
        });

        return () => {
            paths.forEach((path) => {
                path.replaceWith(path.cloneNode(true));
            });
        };
    }, [svgContent, cameras, selectedProvince, onProvinceClick]);

    return (
        <div className="relative">
            {/* Legend */}
            <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 z-10">
                <h3 className="text-white font-bold mb-2 text-sm">สถานะกล้อง</h3>
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500"></div>
                        <span className="text-gray-300">กล้องทำงาน</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500"></div>
                        <span className="text-gray-300">กล้องไม่ทำงาน</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#6f9c76]"></div>
                        <span className="text-gray-300">ไม่มีกล้อง</span>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div
                ref={svgRef}
                className="thailand-map w-full h-full min-h-[500px] bg-gray-800 rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{
                    ['--province-hover' as string]: '#3b82f6',
                }}
            />

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                    }}
                >
                    {tooltip.content}
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
}
