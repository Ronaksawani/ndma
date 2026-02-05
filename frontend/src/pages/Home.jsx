import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "../styles/Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [counters, setCounters] = useState({
    volunteers: 50000,
    trainings: 1200,
    states: 28,
  });

  return (
    <div className={styles["home-wrapper"]}>
      <Navbar />

      <div className={styles["home-container"]}>
        {/* Hero Section */}
        <section className={styles["hero-section"]}>
          <div className={styles["hero-content"]}>
            <div className={styles["hero-text"]}>
              <h1 className={styles["hero-title"]}>
                Building a Resilient India
                <br />
                Through Capacity Building
              </h1>
              <p className={styles["hero-subtitle"]}>
                Real-Time Monitoring System for Disaster Management Training
                Programs
              </p>
            </div>
            <div className={styles["hero-image"]}>
              <img
                src="/images/disaster-training.png"
                alt="Disaster Management Training Team"
                className={styles["hero-img"]}
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/500x400?text=Disaster+Management")
                }
              />
            </div>
          </div>
        </section>

        {/* Live Impact Counters */}
        <section className={styles["counters-section"]}>
          <div className={styles["counters-wrapper"]}>
            <div className={styles["counter-card"]}>
              <div className={styles["counter-icon"]}>👥</div>
              <div className={styles["counter-text"]}>
                <div className={styles["counter-label"]}>
                  Total Volunteers Trained
                </div>
                <div className={styles["counter-number"]}>
                  {counters.volunteers.toLocaleString()}+
                </div>
              </div>
            </div>

            <div className={styles["counter-card"]}>
              <div className={styles["counter-icon"]}>📚</div>
              <div className={styles["counter-text"]}>
                <div className={styles["counter-label"]}>
                  Trainings Conducted
                </div>
                <div className={styles["counter-number"]}>
                  {counters.trainings.toLocaleString()}+
                </div>
              </div>
            </div>

            <div className={styles["counter-card"]}>
              <div className={styles["counter-icon"]}>🗺️</div>
              <div className={styles["counter-text"]}>
                <div className={styles["counter-label"]}>States Covered</div>
                <div className={styles["counter-number"]}>
                  {counters.states}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disaster Preparedness Section */}
        <section className={styles["preparedness-section"]}>
          <div className={styles["preparedness-wrapper"]}>
            <h2 className={styles["section-title"]}>
              Disaster Preparedness & Safety
            </h2>
            <div className={styles["disaster-grid"]}>
              {/* Earthquakes */}
              <div className={styles["disaster-card"]}>
                <div className={styles["disaster-image"]}>
                  <img
                    src="/images/earthquake.png"
                    alt="Earthquakes"
                    className={styles["disaster-img"]}
                  />
                </div>
                <h3 className={styles["disaster-title"]}>Earthquakes</h3>
                <div className={styles["disaster-content"]}>
                  <div className={styles["do-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Repair deep plaster cracks in ceilings and foundations.
                        Get expert advice if there are signs of structural
                        defects.
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Anchor overhead lighting fixtures to the ceiling.
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Follow BIS codes relevant to your area for building
                        standards
                      </span>
                    </div>
                  </div>
                  <div className={styles["divider"]}></div>
                  <div className={styles["dont-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["cross-icon"]}>✕</span>
                      <span>Do not move from where you are.</span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["cross-icon"]}>✕</span>
                      <span>Do not light a match.</span>
                    </div>
                  </div>
                </div>
                <button className={styles["view-more-btn"]}>View More +</button>
              </div>

              {/* Landslide */}
              <div className={styles["disaster-card"]}>
                <div className={styles["disaster-image"]}>
                  <img
                    src="/images/landslide.png"
                    alt="Landslide"
                    className={styles["disaster-img"]}
                  />
                </div>
                <h3 className={styles["disaster-title"]}>Landslide</h3>
                <div className={styles["disaster-content"]}>
                  <div className={styles["do-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Prepare tour to hilly region according to information
                        given by weather department or news channel.
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Move away from landslide path or downstream valleys
                        quickly without wasting time.
                      </span>
                    </div>
                  </div>
                  <div className={styles["divider"]}></div>
                  <div className={styles["dont-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["cross-icon"]}>✕</span>
                      <span>
                        Try to avoid construction and staying in vulnerable
                        areas.
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["cross-icon"]}>✕</span>
                      <span>Do not panic and loose energy by crying.</span>
                    </div>
                  </div>
                </div>
                <button className={styles["view-more-btn"]}>View More +</button>
              </div>

              {/* Tsunami */}
              <div className={styles["disaster-card"]}>
                <div className={styles["disaster-image"]}>
                  <img
                    src="/images/flood.png"
                    alt="Tsunami"
                    className={styles["disaster-img"]}
                  />
                </div>
                <h3 className={styles["disaster-title"]}>Tsunami</h3>
                <div className={styles["disaster-content"]}>
                  <div className={styles["do-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Know the height of your street above sea level and the
                        distance of your street from the coast or other
                        high-risk waters.
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Plan evacuation routes from your home, school,
                        workplace, or any other place you could be where
                        tsunamis present a risk
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>Practice your evacuation routes.</span>
                    </div>
                  </div>
                  <div className={styles["divider"]}></div>
                  <div className={styles["dont-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["cross-icon"]}>✕</span>
                      <span>
                        Move immediately to higher ground, DO NOT wait for a
                        tsunami warning to be announced.
                      </span>
                    </div>
                  </div>
                </div>
                <button className={styles["view-more-btn"]}>View More +</button>
              </div>

              {/* Cyclone */}
              <div className={styles["disaster-card"]}>
                <div className={styles["disaster-image"]}>
                  <img
                    src="/images/cyclone.png"
                    alt="Cyclone"
                    className={styles["disaster-img"]}
                  />
                </div>
                <h3 className={styles["disaster-title"]}>Cyclone</h3>
                <div className={styles["disaster-content"]}>
                  <div className={styles["do-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Check the house; secure loose tiles and carry out
                        repairs of doors and windows.
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Keep some wooden boards ready so that glass windows can
                        be boarded if needed
                      </span>
                    </div>
                    <div className={styles["tip-item"]}>
                      <span className={styles["check-icon"]}>✓</span>
                      <span>
                        Keep a hurricane lantern filled with kerosene, battery
                        operated torches and enough dry cells
                      </span>
                    </div>
                  </div>
                  <div className={styles["divider"]}></div>
                  <div className={styles["dont-section"]}>
                    <div className={styles["tip-item"]}>
                      <span className={styles["cross-icon"]}>✕</span>
                      <span>
                        DO NOT venture out even when the winds appear to calm
                        down.
                      </span>
                    </div>
                  </div>
                </div>
                <button className={styles["view-more-btn"]}>View More +</button>
              </div>
            </div>
          </div>
        </section>

        {/* Latest News */}
        <section className={styles["news-section"]}>
          <div className={styles["news-wrapper"]}>
            <h2 className={styles["section-title"]}>Latest News</h2>
            <div className={styles["news-list"]}>
              <div className={styles["news-item"]}>
                <div className={styles["news-item-content"]}>
                  <h4 className={styles["news-item-title"]}>
                    Press Release - Five Regional Metter in india latt NDMA,
                    Disaster Management Training Portal another
                  </h4>
                  <p className={styles["news-item-date"]}>
                    Feb 21, 2022, 10:45 pm
                  </p>
                </div>
              </div>

              <div className={styles["news-item"]}>
                <div className={styles["news-item-content"]}>
                  <h4 className={styles["news-item-title"]}>
                    Press Release - Firelest Week to Fire Kahugar India
                    Management NDMA Disaster Management Training Portal
                  </h4>
                  <p className={styles["news-item-date"]}>
                    Feb 21, 2022, 12:33 am
                  </p>
                </div>
              </div>

              <div className={styles["news-item"]}>
                <div className={styles["news-item-content"]}>
                  <h4 className={styles["news-item-title"]}>
                    Press Release - Tomittar rumash-in NDMA Disaster Management
                    Training Portal im pis coSInity
                  </h4>
                  <p className={styles["news-item-date"]}>
                    Feb 21, 2022, 11:55 pm
                  </p>
                </div>
              </div>
            </div>
            <div className={styles["news-footer"]}>
              <button
                className={styles["show-more-btn"]}
                onClick={() => navigate("/resources")}
              >
                Show More
              </button>
            </div>
          </div>
        </section>

        {/* Social Media Section */}
        <section className={styles["social-section"]}>
          <div className={styles["social-wrapper"]}>
            <div className={styles["social-header"]}>
              <span className={styles["social-icon"]}>📱</span>
              <h2 className={styles["social-title"]}>Social Media</h2>
            </div>
            <div className={styles["social-grid"]}>
              {/* Twitter Card */}
              <a
                href="https://twitter.com/ndmaindia"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-card"]}
              >
                <div className={styles["social-platform"]}>
                  <svg
                    className={styles["social-platform-icon"]}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="28"
                    height="28"
                    aria-hidden="true"
                  >
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9-5 9-5" />
                  </svg>
                  <span className={styles["platform-name"]}>𝕏</span>
                </div>
                <p className={styles["social-follow-text"]}>Follow NDMA on X</p>
              </a>

              {/* Facebook Card */}
              <a
                href="https://www.facebook.com/ndmaindia"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-card"]}
              >
                <div className={styles["social-platform"]}>
                  <svg
                    className={styles["social-platform-icon"]}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="28"
                    height="28"
                    aria-hidden="true"
                  >
                    <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a1 1 0 011-1h3z" />
                  </svg>
                  <span className={styles["platform-name"]}>Facebook</span>
                </div>
                <p className={styles["social-follow-text"]}>
                  Follow NDMA on Facebook
                </p>
              </a>

              {/* YouTube Card */}
              <a
                href="https://www.youtube.com/@ndmaindia"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-card"]}
              >
                <div className={styles["social-platform"]}>
                  <svg
                    className={styles["social-platform-icon"]}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="28"
                    height="28"
                    aria-hidden="true"
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.54c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
                    <polygon
                      points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
                      fill="white"
                    />
                  </svg>
                  <span className={styles["platform-name"]}>YouTube</span>
                </div>
                <p className={styles["social-follow-text"]}>
                  Subscribe to NDMA YouTube
                </p>
              </a>

              {/* LinkedIn Card */}
              <a
                href="https://www.linkedin.com/company/ndma-india"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-card"]}
              >
                <div className={styles["social-platform"]}>
                  <svg
                    className={styles["social-platform-icon"]}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="28"
                    height="28"
                    aria-hidden="true"
                  >
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  <span className={styles["platform-name"]}>LinkedIn</span>
                </div>
                <p className={styles["social-follow-text"]}>
                  Follow NDMA on LinkedIn
                </p>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles["cta-section"]}>
          <div className={styles["cta-wrapper"]}>
            <h2 className={styles["cta-title"]}>Ready to Get Started?</h2>
            <p className={styles["cta-subtitle"]}>
              Join thousands of organizations building disaster resilience
              across India
            </p>
            <div className={styles["cta-buttons"]}>
              <button
                className={`${styles["cta-btn"]} ${styles["cta-btn-primary"]}`}
                onClick={() => navigate("/partner-registration-guide")}
              >
                Register as Partner
              </button>
              <button
                className={`${styles["cta-btn"]} ${styles["cta-btn-secondary"]}`}
                onClick={() => navigate("/login?role=partner")}
              >
                Partner Login
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles["home-footer"]}>
          <div className={styles["footer-content"]}>
            <div className={styles["footer-section"]}>
              <h4 className={styles["footer-title"]}>Government Links</h4>
              <ul className={styles["footer-list"]}>
                <li>
                  <a
                    href="https://ndma.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    NDMA Website
                  </a>
                </li>
                <li>
                  <a
                    href="https://mha.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ministry of Home Affairs
                  </a>
                </li>
                <li>
                  <a
                    href="https://india.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    India.gov.in
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles["footer-section"]}>
              <h4 className={styles["footer-title"]}>Resources</h4>
              <ul className={styles["footer-list"]}>
                <li>
                  <a href="/resources">Documentation</a>
                </li>
                <li>
                  <a href="/resources">Training Materials</a>
                </li>
                <li>
                  <a href="/resources">Guidelines</a>
                </li>
              </ul>
            </div>

            <div className={styles["footer-section"]}>
              <h4 className={styles["footer-title"]}>Contact</h4>
              <ul className={styles["footer-list"]}>
                <li>📧 contact@ndma.gov.in</li>
                <li>📞 +91-11-2634-5858</li>
                <li>📍 NDMA, India</li>
              </ul>
            </div>

            <div className={styles["footer-section"]}>
              <h4 className={styles["footer-title"]}>Legal</h4>
              <ul className={styles["footer-list"]}>
                <li>
                  <a href="#privacy">Privacy Policy</a>
                </li>
                <li>
                  <a href="#terms">Terms of Service</a>
                </li>
                <li>
                  <a href="#disclaimer">Disclaimer</a>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles["footer-bottom"]}>
            <p className={styles["footer-copyright"]}>
              © 2024 National Disaster Management Authority (NDMA). All rights
              reserved.
            </p>
            <p className={styles["footer-credit"]}>
              Built for Capacity Building & Training Division, NDMA
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
