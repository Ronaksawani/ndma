import React, { useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import jsPDF from "jspdf";
import Sidebar from "../components/Sidebar";
import { participantAPI } from "../utils/api";
import styles from "../styles/Participant.module.css";
import certStyles from "../styles/Certificate.module.css";

const CERTIFICATE_TEMPLATE = "/images/certificate_templet.png";

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export default function ParticipantCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, profileRes] = await Promise.all([
        participantAPI.getRecords(),
        participantAPI.getProfile(),
      ]);
      setCertificates(recordsRes.data?.certificates || []);
      setProfile(profileRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificatePdf = async (cert) => {
    const template = await loadImage(CERTIFICATE_TEMPLATE);
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [270, 190] });

    doc.addImage(template, "PNG", 0, 0, 270, 190);

    const participantName = profile?.fullName || "Participant Name";
    const certificateTitle = cert.certificateTitle || "CERTIFICATE OF PARTICIPATION";
    const trainingTitle = cert.trainingTitle || "Training Program";
    const issueDate = cert.certificateIssuedAt
      ? new Date(cert.certificateIssuedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

    // Use a conservative set of overlays so we don't duplicate text
    // that's already part of the template image. Only place the
    // participant name, training title and issued date, with
    // sizes and positions tuned for the existing template.
    doc.setTextColor(28, 67, 130);

    // Participant name: prominent, centered
    doc.setFont("times", "bold");
    doc.setFontSize(30);
    doc.text(participantName, 135, 118.5, { align: "center" });

    // Training title: slightly smaller and below the name
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    // wrap long titles across lines if necessary
    const wrapWidth = 180; // approx mm width for 270x190 page
    const trainingLines = doc.splitTextToSize(trainingTitle, wrapWidth);
    doc.text(trainingLines, 135, 136.2, { align: "center" });

    // Issued date
    doc.setFont("times", "Bold");
    doc.setFontSize(9);
    doc.text(`${issueDate}`, 40.5, 170, { align: "center" });

    const safeParticipantName = participantName.replace(/[^a-z0-9]+/gi, "_");
    const safeTrainingTitle = trainingTitle.replace(/[^a-z0-9]+/gi, "_");
    doc.save(`${safeParticipantName}_${safeTrainingTitle}_Certificate.pdf`);
  };

  const downloadCertificate = async (cert) => {
    try {
      await generateCertificatePdf(cert);
    } catch (error) {
      console.error("Failed to generate certificate PDF:", error);
      alert("Failed to generate certificate PDF");
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar role="participant" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={styles.main}>
          <header className={styles.topBar}>
            <button 
              className={styles.sidebarToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <FiMenu size={24} />
            </button>
            <h1 className={styles.title}>My Certificates</h1>
          </header>
          <section className={styles.page}>
            <p>Loading...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar role="participant" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.main}>
        <header className={styles.topBar}>
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>
          <h1 className={styles.title}>
            {certificates.length > 1 ? "Certificates" : "Certificate"} ({certificates.length})
          </h1>
        </header>
        <section className={styles.page}>
          {certificates.length === 0 ? (
            <div className={certStyles.noCertificates}>
              <div className={certStyles.noCertsIcon}>🏆</div>
              <h2>No Certificates Yet</h2>
              <p>Complete trainings to earn certificates</p>
            </div>
          ) : (
            <div className={certStyles.certificatesGrid}>
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className={certStyles.certificateCard}
                  onClick={() => setSelectedCert(cert)}
                >
                  <div className={certStyles.cardPreview}>
                    <div className={certStyles.certificatePreview}>
                      <div className={certStyles.previewContent}>
                        <div className={certStyles.previewTitle}>Certificate of</div>
                        <div className={certStyles.previewCompletion}>Completion</div>
                        <div className={certStyles.previewName}>{profile?.fullName}</div>
                        <div className={certStyles.previewTraining}>{cert.trainingTitle}</div>
                      </div>
                    </div>
                  </div>
                  <div className={certStyles.cardDetails}>
                    <h3 className={certStyles.trainingTitle}>{cert.trainingTitle}</h3>
                    <p className={certStyles.trainingTheme}>{cert.trainingTheme}</p>
                    <p className={certStyles.issuedDate}>
                      Issued: {new Date(cert.certificateIssuedAt).toLocaleDateString()}
                    </p>
                    <button
                      className={certStyles.viewBtn}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await downloadCertificate(cert);
                      }}
                    >
                      View Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCert && (
            <div className={certStyles.modal} onClick={() => setSelectedCert(null)}>
              <div className={certStyles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button
                  className={certStyles.closeBtn}
                  onClick={() => setSelectedCert(null)}
                >
                  ✕
                </button>
                <div className={certStyles.certificateViewer}>
                  {/* Professional Certificate Design */}
                  <div className={certStyles.certificate}>
                    <div className={certStyles.certificateHeader}>
                      <div className={certStyles.headerBrand}>
                        <h1 className={certStyles.headerTitle}>CERTIFICATE</h1>
                        <p className={certStyles.headerSubtitle}>of Completion</p>
                      </div>
                      <div className={certStyles.headerDecor}>⭐</div>
                    </div>

                    <div className={certStyles.certificateBody}>
                      <p className={certStyles.bodyIntro}>This is to certify that</p>

                      <div className={certStyles.recipientInfo}>
                        <div className={certStyles.field}>
                          <div className={certStyles.fieldLabel}>Name</div>
                          <div className={certStyles.fieldContent}>{profile?.fullName}</div>
                        </div>
                        <div className={certStyles.field}>
                          <div className={certStyles.fieldLabel}>Date of Birth</div>
                          <div className={certStyles.fieldContent}>
                            {profile?.dateOfBirth
                              ? new Date(profile.dateOfBirth).toLocaleDateString()
                              : "-"}
                          </div>
                        </div>
                        <div className={certStyles.field}>
                          <div className={certStyles.fieldLabel}>Gender</div>
                          <div className={certStyles.fieldContent}>{profile?.gender || "-"}</div>
                        </div>
                      </div>

                      <p className={certStyles.bodyMiddle}>
                        has successfully completed the training program on
                      </p>

                      <div className={certStyles.trainingInfo}>
                        <h2 className={certStyles.trainingTitle}>{selectedCert.trainingTitle}</h2>
                        <p className={certStyles.trainingDetails}>
                          Theme: <strong>{selectedCert.trainingTheme}</strong>
                        </p>
                        <p className={certStyles.trainingDetails}>
                          Dates: {selectedCert.trainingDates?.start || "-"} to{" "}
                          {selectedCert.trainingDates?.end || "-"}
                        </p>
                        <p className={certStyles.trainingDetails}>
                          Organization: <strong>{selectedCert.organization || "-"}</strong>
                        </p>
                      </div>

                      <p className={certStyles.bodyConclusion}>
                        This certificate is awarded in recognition of the successful completion
                        of the above mentioned course and in testimony of the knowledge and skills
                        acquired.
                      </p>
                    </div>

                    <div className={certStyles.certificateFooter}>
                      <div className={certStyles.footerItem}>
                        <div className={certStyles.footerLine}>_________________</div>
                        <div className={certStyles.footerLabel}>Signature</div>
                      </div>
                      <div className={certStyles.footerItem}>
                        <div className={certStyles.footerDate}>
                          {selectedCert.certificateIssuedAt
                            ? new Date(selectedCert.certificateIssuedAt).toLocaleDateString()
                            : "-"}
                        </div>
                        <div className={certStyles.footerLabel}>Date</div>
                      </div>
                      <div className={certStyles.footerItem}>
                        <div className={certStyles.certificateId}>
                          ID: {selectedCert._id.substring(0, 12).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={certStyles.modalActions}>
                    <button
                      className={certStyles.downloadBtn}
                      onClick={() => downloadCertificate(selectedCert)}
                    >
                      📥 Download PDF
                    </button>
                    <button
                      className={certStyles.printBtn}
                      onClick={() => window.print()}
                    >
                      🖨️ Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
