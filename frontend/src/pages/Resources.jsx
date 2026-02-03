import React, { useState } from "react";
import Navbar from "../components/Navbar";
import styles from "../styles/Resources.module.css";
import { FiDownload, FiExternalLink, FiBook, FiVideo, FiFile, FiX } from "react-icons/fi";

const resources = [
  {
    id: 1,
    title: "Disaster Management Framework 2023",
    type: "pdf",
    description: "Comprehensive framework outlining India's approach to disaster management, including prevention, preparedness, response, and recovery.",
    size: "2.5 MB",
    downloads: 1250,
    pdfUrl: "https://ndma.gov.in/sites/default/files/PDF/Disaster_Management_Framework_2023.pdf",
  },
  {
    id: 2,
    title: "Training Program Standards",
    type: "pdf",
    description: "Standards and guidelines for conducting quality training programs in disaster management across India.",
    size: "1.8 MB",
    downloads: 890,
    pdfUrl: "https://ndma.gov.in/sites/default/files/PDF/Training_Guidelines.pdf",
  },
  {
    id: 3,
    title: "First Aid & Medical Response Manual",
    type: "pdf",
    description: "Complete first aid training material for immediate medical response in disaster situations.",
    size: "3.2 MB",
    downloads: 2100,
    pdfUrl: "https://ndma.gov.in/sites/default/files/PDF/First_Aid_Manual.pdf",
  },
  {
    id: 4,
    title: "Flood Preparedness Guide",
    type: "pdf",
    description: "Comprehensive guide on flood risk assessment, preparedness measures, and emergency response procedures.",
    size: "2.1 MB",
    downloads: 1450,
    pdfUrl: "https://ndma.gov.in/sites/default/files/PDF/Flood_Preparedness.pdf",
  },
  {
    id: 5,
    title: "Earthquake Safety Guide",
    type: "pdf",
    description: "Essential guidelines for earthquake preparedness, structural safety, and post-earthquake response.",
    size: "1.9 MB",
    downloads: 980,
    pdfUrl: "https://ndma.gov.in/sites/default/files/PDF/Earthquake_Safety.pdf",
  },
  {
    id: 6,
    title: "Cyclone Preparedness Training",
    type: "video",
    description: "NDMA training video on cyclone preparedness and disaster response measures.",
    duration: "45 minutes",
    downloads: 1540,
    videoId: "B9qR2e3xyJo",
  },
  {
    id: 7,
    title: "Flood Management Operations",
    type: "video",
    description: "Comprehensive video on flood management strategies and emergency response operations.",
    duration: "38 minutes",
    downloads: 1320,
    videoId: "spNyX6M5I2A",
  },
  {
    id: 8,
    title: "Earthquake Response Procedures",
    type: "video",
    description: "Step-by-step procedures for effective earthquake response and rescue operations.",
    duration: "52 minutes",
    downloads: 2050,
    videoId: "U4QLsUNPXnU",
  },
];

const guidelinesData = {
  "Partner Registration": {
    description: "Step-by-step guide for registering as a training partner",
    content: `
      <h3>Partner Registration Guidelines</h3>
      <p>Welcome to the NDMA Training Portal Partner Program. This guide will help you register your organization as an authorized training partner.</p>
      
      <h4>Eligibility Criteria</h4>
      <ul>
        <li>Organization must be registered with valid legal documentation</li>
        <li>Must have experience in disaster management or related fields</li>
        <li>At least 2 years of operational history</li>
        <li>Trained and certified instructors/trainers on staff</li>
        <li>Proper infrastructure for conducting training programs</li>
      </ul>
      
      <h4>Registration Process</h4>
      <ol>
        <li>Click on "Register as Partner" from the main navigation</li>
        <li>Fill in organization details including name, address, and contact information</li>
        <li>Upload required documents (registration certificate, authorization letter, proof of experience)</li>
        <li>Provide information about training infrastructure and resources</li>
        <li>Submit the application for review</li>
        <li>Wait for email confirmation (typically 3-5 business days)</li>
      </ol>
      
      <h4>Required Documents</h4>
      <ul>
        <li>Organization Registration Certificate (PAN)</li>
        <li>Authorization Letter from organization head</li>
        <li>Proof of experience (previous training reports, certifications)</li>
        <li>List of trained instructors with qualifications</li>
        <li>Facility photographs and infrastructure details</li>
      </ul>
      
      <h4>After Registration</h4>
      <p>Once your organization is approved, you will receive login credentials to access the partner dashboard where you can:</p>
      <ul>
        <li>Submit training events</li>
        <li>Track approved trainings</li>
        <li>Generate and issue certificates</li>
        <li>View analytics and reports</li>
      </ul>
    `,
  },
  "Training Submission": {
    description: "How to submit and manage training events on the portal",
    content: `
      <h3>Training Submission Guidelines</h3>
      <p>This guide explains how to submit training events through the NDMA Training Portal.</p>
      
      <h4>Before You Begin</h4>
      <p>Ensure you have:</p>
      <ul>
        <li>Approved partner account</li>
        <li>Training schedule finalized</li>
        <li>Trainer details and qualifications</li>
        <li>Training venue and logistics arranged</li>
        <li>Supporting documents (photos, attendance sheet template)</li>
      </ul>
      
      <h4>Submission Steps</h4>
      <ol>
        <li>Log in to your partner dashboard</li>
        <li>Navigate to "Add Training" section</li>
        <li>Fill in training details:
          <ul>
            <li>Training title and theme</li>
            <li>Description and objectives</li>
            <li>Start and end dates/times</li>
            <li>Location (state, district, city)</li>
            <li>Expected participant count</li>
          </ul>
        </li>
        <li>Provide trainer information:
          <ul>
            <li>Name and qualifications</li>
            <li>Contact email</li>
            <li>Experience background</li>
          </ul>
        </li>
        <li>Upload training materials (up to 10 photos, attendance sheet)</li>
        <li>Review all information for accuracy</li>
        <li>Submit for approval</li>
      </ol>
      
      <h4>Approval Timeline</h4>
      <ul>
        <li>Initial review: 1-2 business days</li>
        <li>Additional verification if needed: 2-3 business days</li>
        <li>Final approval: Email notification sent</li>
      </ul>
      
      <h4>Post-Training Requirements</h4>
      <p>After training completion, you must:</p>
      <ul>
        <li>Upload final attendance sheet within 7 days</li>
        <li>Generate participant certificates</li>
        <li>Provide feedback on training outcomes</li>
      </ul>
    `,
  },
  "Certificate Generation": {
    description: "Guidelines for creating and issuing certificates",
    content: `
      <h3>Certificate Generation Guidelines</h3>
      <p>Learn how to generate and issue certificates for training participants.</p>
      
      <h4>Certificate System Features</h4>
      <ul>
        <li>Automated certificate generation</li>
        <li>Unique certificate ID for each participant</li>
        <li>Digital verification capability</li>
        <li>Official NDMA seal and signatures</li>
      </ul>
      
      <h4>Certificate Contents</h4>
      <p>Each certificate includes:</p>
      <ul>
        <li>Participant name</li>
        <li>Training program title</li>
        <li>Training dates and duration</li>
        <li>Trainer/Organization name</li>
        <li>Certificate issue date</li>
        <li>Unique certificate number</li>
        <li>QR code for verification</li>
      </ul>
      
      <h4>Generating Certificates</h4>
      <ol>
        <li>Access your approved training from dashboard</li>
        <li>Upload final participant list with attendance</li>
        <li>Click "Generate Certificates" button</li>
        <li>Review generated certificates preview</li>
        <li>Download as PDF or print</li>
        <li>Share with participants (digital or physical)</li>
      </ol>
      
      <h4>Certificate Verification</h4>
      <p>Participants can verify their certificates by:</p>
      <ul>
        <li>Scanning the QR code on the certificate</li>
        <li>Entering the unique certificate number on "Verify Certificate" page</li>
        <li>Checking the NDMA registry for authentic records</li>
      </ul>
      
      <h4>Important Notes</h4>
      <ul>
        <li>Only participants with 80% attendance can receive certificates</li>
        <li>Certificates are valid for lifetime reference</li>
        <li>Do not alter or modify certificates</li>
        <li>Report any certificate-related queries to support@ndma.gov.in</li>
      </ul>
    `,
  },
  "Data Quality Standards": {
    description: "Quality standards for training data entry",
    content: `
      <h3>Data Quality Standards</h3>
      <p>Maintain high data quality standards when entering training information on the portal.</p>
      
      <h4>Key Data Quality Principles</h4>
      <ul>
        <li>Accuracy - All data must be precise and factual</li>
        <li>Completeness - All required fields must be filled</li>
        <li>Consistency - Use standardized formats and naming conventions</li>
        <li>Timeliness - Submit data promptly after training completion</li>
        <li>Validity - Ensure data meets specified formats</li>
      </ul>
      
      <h4>Training Title Standards</h4>
      <ul>
        <li>Clear and descriptive (minimum 10, maximum 100 characters)</li>
        <li>Include disaster type or specific focus area</li>
        <li>Example: "Flood Risk Assessment and Preparedness Training"</li>
      </ul>
      
      <h4>Location Data Standards</h4>
      <ul>
        <li>Must include valid state and district</li>
        <li>City/town name should match official records</li>
        <li>Latitude/Longitude must be precise to 4 decimal places</li>
        <li>Use actual training venue coordinates</li>
      </ul>
      
      <h4>Participant Count Standards</h4>
      <ul>
        <li>Expected count: Must match actual attendance (±10% tolerance)</li>
        <li>Participant breakdown must sum to total count</li>
        <li>Minimum 5 participants for valid training</li>
        <li>Maximum 500 participants per event</li>
      </ul>
      
      <h4>Date and Time Standards</h4>
      <ul>
        <li>Use 24-hour format for times</li>
        <li>Start time must be before end time</li>
        <li>Minimum duration: 4 hours per training day</li>
        <li>Maximum duration: 10 hours per training day</li>
      </ul>
      
      <h4>Document Upload Standards</h4>
      <ul>
        <li>Photos: Clear, high-resolution (minimum 1024x768px)</li>
        <li>Format: JPG or PNG only</li>
        <li>File size: Maximum 5MB per photo</li>
        <li>Attendance sheet: CSV or Excel format</li>
        <li>Include participant names, contact, attendance percentage</li>
      </ul>
      
      <h4>Common Data Entry Errors to Avoid</h4>
      <ul>
        <li>Misspelled location names</li>
        <li>Incorrect date formats</li>
        <li>Inconsistent trainer information</li>
        <li>Missing or incomplete attendance records</li>
        <li>Unrealistic participant counts</li>
      </ul>
    `,
  },
};

function PdfViewer({ pdfUrl, title, onClose }) {
  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["pdf-modal"]} onClick={(e) => e.stopPropagation()}>
        <button className={styles["close-pdf"]} onClick={onClose}>
          <FiX size={24} />
        </button>
        <h3>{title}</h3>
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
          className={styles["pdf-viewer"]}
          title={title}
        />
      </div>
    </div>
  );
}

function GuidelineDetail({ title, onClose }) {
  const guideline = guidelinesData[title];
  if (!guideline) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["guideline-modal"]} onClick={(e) => e.stopPropagation()}>
        <button className={styles["close-pdf"]} onClick={onClose}>
          <FiX size={24} />
        </button>
        <div className={styles["guideline-content"]}>
          <div dangerouslySetInnerHTML={{ __html: guideline.content }} />
        </div>
      </div>
    </div>
  );
}

export default function Resources() {
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [viewingVideo, setViewingVideo] = useState(null);

  return (
    <div className={styles["wrapper"]}>
      <Navbar />

      {selectedPdf && (
        <PdfViewer
          pdfUrl={selectedPdf.pdfUrl}
          title={selectedPdf.title}
          onClose={() => setSelectedPdf(null)}
        />
      )}

      {selectedGuideline && (
        <GuidelineDetail
          title={selectedGuideline}
          onClose={() => setSelectedGuideline(null)}
        />
      )}

      <div className={styles["container"]}>
        <section className={styles["hero"]}>
          <h1 className={styles["title"]}>Resources & Materials</h1>
          <p className={styles["subtitle"]}>
            Access comprehensive training materials, guidelines, and documentation for disaster management programs
          </p>
        </section>

        <section className={styles["content"]}>
          {/* Downloadable Resources */}
          <div className={styles["section"]}>
            <h2 className={styles["section-title"]}>Downloadable Resources</h2>

            <div className={styles["resources-grid"]}>
              {resources.map((resource) => (
                <div key={resource.id} className={styles["resource-card"]}>
                  <div className={styles["resource-icon"]}>
                    {resource.type === "pdf" ? (
                      <FiFile />
                    ) : (
                      <FiVideo />
                    )}
                  </div>

                  <h3 className={styles["resource-title"]}>
                    {resource.title}
                  </h3>
                  <p className={styles["resource-desc"]}>
                    {resource.description}
                  </p>

                  <div className={styles["resource-meta"]}>
                    <span className={styles["resource-type"]}>
                      {resource.type === "pdf"
                        ? `${resource.size}`
                        : `${resource.duration}`}
                    </span>
                    <span className={styles["resource-downloads"]}>
                      {resource.downloads} downloads
                    </span>
                  </div>

                  {resource.type === "pdf" ? (
                    <button
                      className={styles["download-btn"]}
                      onClick={() => setSelectedPdf(resource)}
                    >
                      <FiDownload /> View & Download
                    </button>
                  ) : (
                    <button
                      className={styles["download-btn"]}
                      onClick={() => setViewingVideo(resource)}
                    >
                      <FiVideo /> Watch Video
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Video Modal */}
            {viewingVideo && (
              <div className={styles["modal-overlay"]} onClick={() => setViewingVideo(null)}>
                <div className={styles["video-modal"]} onClick={(e) => e.stopPropagation()}>
                  <button className={styles["close-pdf"]} onClick={() => setViewingVideo(null)}>
                    <FiX size={24} />
                  </button>
                  <h3>{viewingVideo.title}</h3>
                  <iframe
                    width="100%"
                    height="500px"
                    src={`https://www.youtube.com/embed/${viewingVideo.videoId}`}
                    title={viewingVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Guidelines Section */}
          <div className={styles["section"]}>
            <h2 className={styles["section-title"]}>Guidelines & Manuals</h2>

            <div className={styles["guidelines-grid"]}>
              {Object.keys(guidelinesData).map((title, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedGuideline(title)}
                  className={styles["guideline-card"]}
                >
                  <div className={styles["guideline-icon"]}>
                    <FiBook />
                  </div>
                  <h3 className={styles["guideline-title"]}>
                    {title}
                  </h3>
                  <p className={styles["guideline-desc"]}>
                    {guidelinesData[title].description}
                  </p>
                  <div className={styles["guideline-cta"]}>
                    Read More <FiExternalLink />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* External Resources */}
          <div className={styles["section"]}>
            <h2 className={styles["section-title"]}>External Resources</h2>

            <div className={styles["external-grid"]}>
              <a
                href="https://ndma.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["external-card"]}
              >
                <h3>NDMA Official Website</h3>
                <p>National Disaster Management Authority official portal with latest updates</p>
                <div className={styles["external-link"]}>
                  Visit <FiExternalLink />
                </div>
              </a>

              <a
                href="https://mha.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["external-card"]}
              >
                <h3>Ministry of Home Affairs</h3>
                <p>Government of India's Ministry of Home Affairs disaster management resources</p>
                <div className={styles["external-link"]}>
                  Visit <FiExternalLink />
                </div>
              </a>

              <a
                href="https://www.unisdr.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["external-card"]}
              >
                <h3>UNISDR Resources</h3>
                <p>United Nations Office for Disaster Risk Reduction materials and guidelines</p>
                <div className={styles["external-link"]}>
                  Visit <FiExternalLink />
                </div>
              </a>

              <a
                href="https://www.preventionweb.net"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["external-card"]}
              >
                <h3>PreventionWeb</h3>
                <p>Global knowledge platform for disaster risk reduction</p>
                <div className={styles["external-link"]}>
                  Visit <FiExternalLink />
                </div>
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <div className={styles["section"]}>
            <h2 className={styles["section-title"]}>Frequently Asked Questions</h2>

            <div className={styles["faq-grid"]}>
              <div className={styles["faq-item"]}>
                <h4>How do I register as a partner?</h4>
                <p>
                  Visit the registration page and fill in your organization details with proper credentials. You'll need to provide authorization documents, proof of experience, and infrastructure details. Your organization will be reviewed by NDMA admin within 3-5 business days.
                </p>
              </div>

              <div className={styles["faq-item"]}>
                <h4>How do I submit training data?</h4>
                <p>
                  After your organization is approved, log in to your partner dashboard and use the "Add Training" form. Provide complete training details including location with coordinates, dates, participant information, trainer details, and upload supporting documents like photos and attendance records.
                </p>
              </div>

              <div className={styles["faq-item"]}>
                <h4>What file formats are accepted?</h4>
                <p>
                  For photos: JPG, PNG (up to 5MB each, minimum 1024x768px). For documents: PDF, CSV, Excel. Maximum 10 photos and 1 attendance sheet per training event with proper structure and data.
                </p>
              </div>

              <div className={styles["faq-item"]}>
                <h4>How long does approval take?</h4>
                <p>
                  Partner organizations are typically reviewed within 3-5 business days. Training events are reviewed within 1-2 business days. You'll receive email notifications about status changes and approval decisions immediately.
                </p>
              </div>

              <div className={styles["faq-item"]}>
                <h4>Can I edit submitted trainings?</h4>
                <p>
                  Yes, you can edit trainings that are in "Pending" status. Once approved or rejected, editing is restricted unless you contact support. For approved trainings, you can update attendance and generate certificates.
                </p>
              </div>

              <div className={styles["faq-item"]}>
                <h4>How do I generate certificates?</h4>
                <p>
                  The system auto-generates certificates for approved trainings after you upload the final attendance sheet. Unique certificate IDs with QR codes are assigned automatically. Download certificates as PDF and share with participants digitally or physically.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className={styles["footer"]}>
        <p>
          &copy; 2024 National Disaster Management Authority (NDMA). All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
