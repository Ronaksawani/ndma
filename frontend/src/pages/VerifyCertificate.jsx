import React, { useState } from "react";
import Navbar from "../components/Navbar";
import styles from "../styles/Verify.module.css";
import { FiCheckCircle } from "react-icons/fi";
import { certificateAPI } from "../utils/api";

export default function VerifyCertificate() {
	const [certificateId, setCertificateId] = useState("");
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleVerify = async (e) => {
		e && e.preventDefault();
		const aadhaarInput = certificateId.replace(/\D/g, "");
		if (!aadhaarInput || !/^\d{12}$/.test(aadhaarInput)) {
			setError("Aadhaar number must be exactly 12 digits");
			return;
		}
		setLoading(true);
		setError("");
		setResult(null);
		try {
			const response = await certificateAPI.verifyByAadhaar(aadhaarInput);
			if (response.data && response.data.success && response.data.verified) {
				const certs = response.data.certificates || [];
				certs.sort((a, b) => {
					const da = a.certificateIssuedAt || a.createdAt || 0;
					const db = b.certificateIssuedAt || b.createdAt || 0;
					return new Date(db) - new Date(da);
				});
				setResult({
					aadhaarNumber: response.data.aadhaarNumber,
					fullName: response.data.fullName,
					certificates: certs,
				});
			} else {
				setError(response.data?.message || "Certificate not found.");
			}
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to verify certificate.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.wrapper}>
			<Navbar />

			<div className={styles.container}>
				<section className={styles.hero}>
					<h1 className={styles.title}>Verify Certificate</h1>
					<p className={styles.subtitle}>
						Verify the authenticity of disaster management training certificates issued through this portal
					</p>
				</section>

				<section className={styles.content}>
					<div className={styles["search-box"]}>
						<form onSubmit={handleVerify}>
							<div className={styles["input-group"]}>
								<input
									type="text"
									placeholder="Enter 12-digit Aadhaar Number"
									value={certificateId}
									onChange={(e) => setCertificateId(e.target.value.replace(/\D/g, "").slice(0, 12))}
									className={styles["input"]}
								/>
								<button type="submit" className={styles["btn"]} disabled={loading}>
									{loading ? "Verifying..." : "Verify"}
								</button>
							</div>
						</form>

						{error && <div className={`${styles.alert} ${styles["alert-error"]}`}>{error}</div>}

						{result && (
							<div className={styles["result-card"]}>
								<div className={styles["result-header"]}>
									<FiCheckCircle className={styles["result-icon"]} />
									<h3 className={styles["result-title"]}>Certificate Verified ✓</h3>
								</div>

								<div className={styles["result-details"]}>
									<div className={styles["detail-row"]}>
										<label>Aadhaar ID:</label>
										<span>{result.aadhaarNumber}</span>
										<label style={{ marginTop: 12 }}>Trainee Name:</label>
										<span>{result.fullName}</span>
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
										<h4 style={{ margin: 0 }}>Certificates found: {result.certificates.length}</h4>
										{result.certificates.map((c, idx) => (
											<div key={c._id || idx} className={styles["detail-row"]}>
												<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
													<div>
														<label>Training Title:</label>
														<div style={{ fontWeight: 700 }}>{c.trainingTitle || 'N/A'}</div>
													</div>
													<div>
														<label>Training Theme:</label>
														<div>{c.trainingTheme || 'N/A'}</div>
													</div>
													<div>
														<label>Training Date:</label>
														<div>
															{c.trainingDates && c.trainingDates.start
																? `${new Date(c.trainingDates.start).toLocaleDateString()} - ${new Date(c.trainingDates.end).toLocaleDateString()}`
																: 'N/A'}
														</div>
													</div>
													<div>
														<label>Organization:</label>
														<div>{c.organization || 'N/A'}</div>
													</div>
													<div>
														<label>Issued On:</label>
														<div>{c.certificateIssuedAt ? new Date(c.certificateIssuedAt).toLocaleDateString() : '-'}</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className={styles["result-footer"]}>
									<p>
										This certificate is valid and issued by NDMA Training Portal.
										<br />
										Certificate verified on: {" "}
										{new Date().toLocaleDateString()}
									</p>
								</div>
							</div>
						)}
					</div>

					<div className={styles["info-section"]}>
						<h2>About Certificate Verification</h2>
						<div className={styles["info-grid"]}>
							<div className={styles["info-card"]}>
								<h4>What is this?</h4>
								<p>
									This service allows you to verify the authenticity of training
									certificates issued by organizations registered with our portal.
								</p>
							</div>
							<div className={styles["info-card"]}>
								<h4>How does it work?</h4>
								<p>
									Enter your 12-digit Aadhaar number as mentioned in your training
									certificate. Our system will verify the certificate against our database.
								</p>
							</div>
							<div className={styles["info-card"]}>
								<h4>Why verify?</h4>
								<p>
									Verification ensures that the certificate is legitimate and issued
									by a registered training partner approved by NDMA.
								</p>
							</div>
							<div className={styles["info-card"]}>
								<h4>Need help?</h4>
								<p>
									If you have questions about your certificate, contact the issuing
									organization directly or reach out to our support team.
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}


