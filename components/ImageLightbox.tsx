"use client";

import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomed(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setZoomed(false);
      }
      if (e.key === "ArrowLeft" && images.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || !images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoomed(false);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoomed(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-medium truncate max-w-[65%]">
          {title || "Photo"}{" "}
          {images.length > 1 && (
            <span className="text-white/60 ml-1">
              ({currentIndex + 1} / {images.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
          >
            {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Close fullscreen image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-auto p-2">
        <img
          src={images[currentIndex]}
          alt={title || `Listing photo ${currentIndex + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          className={`transition-transform duration-200 rounded-md ${
            zoomed
              ? "scale-150 cursor-zoom-out"
              : "max-h-[82vh] max-w-full object-contain cursor-zoom-in"
          }`}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple photos) */}
      {images.length > 1 && (
        <div
          className="flex justify-center gap-2 px-4 py-3 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setZoomed(false);
              }}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                idx === currentIndex ? "border-emerald-500 scale-105" : "border-transparent opacity-60"
              }`}
            >
              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}