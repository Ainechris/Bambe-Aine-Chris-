import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Award, ExternalLink, FileText, Lock, X } from 'lucide-react';
import {
  type CertificateRecord,
  formatDisplayDate,
  isSafeHttpUrl,
} from '../types/portfolio.ts';
import { Reveal, useInView } from './MotionPrimitives.tsx';

interface CertificatesSectionProps {
  refreshTrigger: number;
  onOpenAdminCertificates: () => void;
}

export const CertificatesSection: React.FC<CertificatesSectionProps> = ({
  refreshTrigger,
  onOpenAdminCertificates,
}) => {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImageCert, setPreviewImageCert] = useState<CertificateRecord | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const { ref: gridRef, inView: gridInView } = useInView();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch('/api/certificates')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load certificates.');
        return (await res.json()) as { certificates?: CertificateRecord[] };
      })
      .then((data) => {
        if (active) {
          setCertificates(Array.isArray(data.certificates) ? data.certificates : []);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load certificates.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  useEffect(() => {
    if (!previewImageCert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImageCert(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImageCert]);

  return (
    <section
      id="certificates"
      aria-labelledby="certificates-heading"
      className="scroll-mt-20 w-full bg-[#0B1320] text-[#F2EFE8] border-t border-[#1F2A44]"
    >
      <div ref={gridRef} className="max-w-[1220px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="font-mono-tech text-xs tracking-[0.14em] text-[#D68C76] font-medium">
                05. Certificates &amp; Learning
              </p>
              <h2
                id="certificates-heading"
                className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F2EFE8] [text-wrap:balance]"
              >
                Certifications &amp; documented learning.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#C7B8A6] leading-relaxed">
                Verified courses, programs, and credentials published directly from my portfolio
                dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenAdminCertificates}
              className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-[40px] px-4 py-2 rounded-lg bg-[#1F2A44] hover:bg-[#293757] border border-[#C7B8A6]/35 hover:border-[#D68C76]/75 text-xs sm:text-sm font-medium text-[#F2EFE8] transition-all duration-150 hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-[#D68C76]" aria-hidden="true" />
              <span>Manage Certificates</span>
            </button>
          </div>
        </Reveal>

        {loading ? (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-[#FAF8F4] border border-[#C7B8A6] overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-[#EAE5DC]" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-1/3 bg-[#EAE5DC] rounded" />
                  <div className="h-5 w-3/4 bg-[#EAE5DC] rounded" />
                  <div className="h-3 w-full bg-[#EAE5DC] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl bg-[#FAF8F4] border border-[#C7B8A6] p-8 text-sm text-[#4A5264]">
            {error}
          </div>
        ) : certificates.length === 0 ? (
          <Reveal>
            <div className="mt-12 rounded-2xl bg-[#1F2A44] border border-[#C7B8A6]/30 p-8 sm:p-10 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#0B1320] border border-[#C7B8A6]/35 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-[#D68C76]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-semibold text-[#F2EFE8]">
                  No published certificates yet
                </h3>
                <p className="mt-1.5 text-sm text-[#DED8CE] max-w-xl leading-relaxed">
                  Verified certificates and technical milestones will appear here as I complete
                  courses and publish them through my dashboard.
                </p>
              </div>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, idx) => {
              const isPdf = cert.fileMime === 'application/pdf';
              const isImage =
                Boolean(cert.fileUrl) &&
                !isPdf &&
                !failedImages[cert.id] &&
                Boolean(cert.fileMime?.startsWith('image/'));
              const safeVerifyUrl = isSafeHttpUrl(cert.verificationUrl) ? cert.verificationUrl : null;

              return (
                <Reveal key={cert.id} delayMs={Math.min((idx % 3) * 75, 200)}>
                  <article className="group h-full rounded-2xl bg-[#FAF8F4] text-[#0B1320] border border-[#C7B8A6] hover:border-[#D68C76] overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(4,7,14,0.65)]">
                    <div>
                      {isImage && cert.fileUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImageCert(cert)}
                          className="relative block w-full aspect-[16/10] bg-[#EAE5DC] overflow-hidden cursor-pointer border-b border-[#C7B8A6]/60"
                          aria-label={`View larger preview of ${cert.title}`}
                        >
                          <div
                            className="media-mask w-full h-full"
                            data-revealed={gridInView ? 'true' : 'false'}
                          >
                            <img
                              src={cert.fileUrl}
                              alt={`${cert.title} certificate issued by ${cert.issuer}`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedImages((prev) => ({ ...prev, [cert.id]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="absolute right-3 bottom-3 px-2.5 py-1 rounded-md bg-[#0B1320]/90 text-[#F2EFE8] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            View Preview
                          </span>
                        </button>
                      ) : isPdf && cert.fileUrl ? (
                        <a
                          href={cert.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-2 w-full aspect-[16/10] bg-[#EAE5DC] hover:bg-[#DFD7CA] border-b border-[#C7B8A6]/60 p-6 transition-colors duration-150"
                        >
                          <div className="w-11 h-11 rounded-xl bg-[#FAF8F4] border border-[#C7B8A6] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#B46A55]" aria-hidden="true" />
                          </div>
                          <span className="text-xs font-medium text-[#0B1320] truncate max-w-full">
                            {cert.originalFileName || 'Certificate Document (PDF)'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-[#4A5264] group-hover:text-[#9A4F3A] transition-colors">
                            <span>Open PDF in new tab</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 w-full aspect-[16/10] bg-[#EAE5DC] border-b border-[#C7B8A6]/60 p-6">
                          <Award className="w-7 h-7 text-[#B46A55]" aria-hidden="true" />
                          <span className="font-mono-tech text-xs text-[#4A5264]">
                            {cert.category}
                          </span>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-tech text-xs text-[#4A5264]">
                          <span className="text-[#9A4F3A] font-semibold">{cert.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{formatDisplayDate(cert.issueDate)}</span>
                        </div>

                        <h3 className="mt-2.5 font-display text-lg font-semibold tracking-tight text-[#0B1320]">
                          {cert.title}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-[#1F2A44]">{cert.issuer}</p>

                        <p className="mt-3 text-sm text-[#4A5264] leading-relaxed line-clamp-3">
                          {cert.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#C7B8A6]/55 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-[#4A5264] font-mono-tech truncate">
                        {cert.credentialId ? `ID: ${cert.credentialId}` : cert.issuer}
                      </span>

                      <div className="flex items-center gap-4 shrink-0">
                        {isImage && cert.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImageCert(cert)}
                            className="font-medium text-[#0B1320] hover:text-[#9A4F3A] transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        )}

                        {isPdf && cert.fileUrl && (
                          <a
                            href={cert.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-[#0B1320] hover:text-[#9A4F3A] transition-colors"
                          >
                            <span>Open PDF</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}

                        {safeVerifyUrl && (
                          <a
                            href={safeVerifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#9A4F3A] hover:underline"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Image Certificates */}
      {previewImageCert && previewImageCert.fileUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          className="fixed inset-0 z-50 bg-[#070C16]/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
          onClick={() => setPreviewImageCert(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#FAF8F4] border border-[#C7B8A6] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#C7B8A6]/60">
              <div>
                <h3
                  id="lightbox-title"
                  className="font-display text-base sm:text-lg font-semibold text-[#0B1320]"
                >
                  {previewImageCert.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#4A5264]">
                  {previewImageCert.issuer} · {formatDisplayDate(previewImageCert.issueDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageCert(null)}
                aria-label="Close certificate preview"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#4A5264] hover:text-[#0B1320] hover:bg-[#EAE5DC] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#EAE5DC] max-h-[75vh] overflow-auto flex items-center justify-center p-4">
              <img
                src={previewImageCert.fileUrl}
                alt={`${previewImageCert.title} full certificate`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[68vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
