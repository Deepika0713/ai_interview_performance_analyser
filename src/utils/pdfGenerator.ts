import { jsPDF } from 'jspdf';

export const generateDocumentationPDF = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
      // Header on continuation pages
      doc.setFontSize(8);
      doc.setTextColor(140, 150, 165);
      doc.setFont('helvetica', 'normal');
      doc.text('AI Interview Performance Analyzer • Technical Specification', margin, 10);
      doc.line(margin, 12, pageWidth - margin, 12);
    }
  };

  const addHeader = (title: string, subtitle?: string) => {
    // Dark cover header bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin, 18);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(147, 197, 253); // blue-300
      doc.text(subtitle, margin, 26);
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Version 4.0.0 • Architecture & ML Pipeline Manual • Generated: ${new Date().toLocaleDateString()}`, margin, 34);

    y = 50;
  };

  const addSectionTitle = (title: string, phaseBadge?: string) => {
    checkPageBreak(16);
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text(title, margin + 4, y + 5.5);

    if (phaseBadge) {
      doc.setFontSize(8);
      doc.setTextColor(52, 211, 153); // emerald-400
      const badgeWidth = doc.getTextWidth(phaseBadge);
      doc.text(phaseBadge, pageWidth - margin - badgeWidth - 4, y + 5.5);
    }

    y += 12;
  };

  const addParagraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 4.8 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 3;
  };

  const addBullet = (bulletLabel: string, bulletText: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900

    const labelStr = `• ${bulletLabel}: `;
    const labelWidth = doc.getTextWidth(labelStr);

    doc.setFont('helvetica', 'normal');
    const remainingWidth = contentWidth - labelWidth;
    const bodyLines = doc.splitTextToSize(bulletText, remainingWidth);

    checkPageBreak(Math.max(bodyLines.length * 4.5, 6) + 2);

    // Print label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text(labelStr, margin, y);

    // Print body lines
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(bodyLines[0], margin + labelWidth, y);

    if (bodyLines.length > 1) {
      for (let i = 1; i < bodyLines.length; i++) {
        y += 4.5;
        doc.text(bodyLines[i], margin + 6, y);
      }
    }
    y += 5.5;
  };

  const addCalloutBox = (title: string, content: string[], bgColor = [241, 245, 249], borderColor = [203, 213, 225]) => {
    checkPageBreak(content.length * 5 + 14);
    const boxY = y;
    const boxHeight = content.length * 5 + 10;

    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(margin, boxY, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 4, boxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    let lineY = boxY + 11;
    content.forEach((line) => {
      doc.text(line, margin + 4, lineY);
      lineY += 5;
    });

    y += boxHeight + 5;
  };

  // ---------------------------------------------------------
  // PAGE 1: TITLE & EXECUTIVE ARCHITECTURE
  // ---------------------------------------------------------
  addHeader(
    'AI Interview Performance Analyzer',
    'Comprehensive ML Pipeline, Architecture & Production Deployment Manual'
  );

  addSectionTitle('1. Executive Overview & Problem Context', 'Production System');
  addParagraph(
    'The AI Interview Performance Analyzer is a multi-modal artificial intelligence system designed to automate comprehensive candidate evaluation during mock and live interviews. Rather than relying on naive text-only transcription or subjective assessment, the system operates across three orthogonal behavioral dimensions: (1) Visual Demeanor & Eye Contact, (2) Speech Prosody & Acoustic Pacing, and (3) Linguistic Relevance & STAR Structural Competency.'
  );

  addCalloutBox(
    'Key Multi-Modal Capabilities Matrix',
    [
      '• Visual Dimension: MediaPipe 3D Face Landmarker (468 landmarks + irises) & DeepFace (1 FPS emotion).',
      '• Acoustic Dimension: Librosa Syllabic Onset Detection (130-160 WPM cadence) & Pydub Silence Tracking (>1.5s).',
      '• Linguistic Dimension: Qwen2-Audio-7B-Instruct (STAR structure, domain keywords, verbatim transcription).',
      '• Executive Scoring: Weighted multi-attribute synthesis yielding an objective 0-100 hire-readiness scorecard.',
    ],
    [238, 242, 255],
    [199, 210, 254]
  );

  addSectionTitle('2. System Architecture & Component Interaction', 'Phase 1 - Phase 4');
  addParagraph(
    'The application architecture comprises four tightly integrated modules communicating through a centralized media cache and schema-compliant JSON representations:'
  );

  addBullet('Ingestion Layer (Phase 1)', 'Captures video/audio inputs (WAV, MP3, MP4, WEBM) via local upload or browser MediaRecorder API with automatic temp file rotation.');
  addBullet('Computer Vision Engine (Phase 2)', 'Sub-samples video streams at 1 FPS to extract 468 3D facial mesh points, solves Perspective-n-Point for Head Pose, and tracks iris displacement.');
  addBullet('Speech & Acoustic Intelligence (Phase 3)', 'Processes audio files with Librosa for vocal activity envelopes, flags long hesitation pauses, and queries Qwen2-Audio-7B-Instruct.');
  addBullet('Executive Dashboard (Phase 4)', 'Renders an interactive Streamlit & React dashboard featuring 5 KPI cards, a 6-axis Performance Radar, Emotion Donut, and Verbatim Transcript.');

  // ---------------------------------------------------------
  // PAGE 2: DETAILED ML PIPELINE BREAKDOWN
  // ---------------------------------------------------------
  doc.addPage();
  y = 18;

  addSectionTitle('3. Phase 2: Computer Vision & Facial Demeanor', 'MediaPipe + DeepFace');
  addParagraph(
    'The vision pipeline operates under strict real-time constraints, utilizing a 1.0 sample-per-second sub-sampling strategy that preserves ML throughput while eliminating video latency:'
  );

  addBullet('MediaPipe 3D Face Landmarker', 'Extracts 468 3D facial coordinates plus refined iris landmarks (Index #468 for left iris center, Index #473 for right iris center).');
  addBullet('Head Pose Estimation (solvePnP)', 'Maps 2D image coordinates against an anthropometric 3D canonical face model. Solves cv2.solvePnP to compute Pitch (nodding/downward glance), Yaw (lateral turning), and Roll (sideways tilt).');
  addBullet('Gaze Direction & Eye Contact %', 'Calculates horizontal iris displacement relative to eye corners. Scores percentage of time candidate maintains direct eye focus toward the camera lens.');
  addBullet('Movement Stability & Fidgeting', 'Measures angular variances across the entire duration to flag repetitive nervous nodding or excessive lateral head swiveling.');
  addBullet('DeepFace Emotion Classification', 'Applies convolutional emotion classification across five primary interview affective states: Neutral (Composed), Confident/Happy, Nervous/Fearful, Sad, and Surprised.');

  addSectionTitle('4. Phase 3: Multimodal Acoustic & Speech Intelligence', 'Qwen2-Audio-7B');
  addParagraph(
    'The speech intelligence engine operates without lossy cascaded pipelines, directly analyzing acoustic signals to assess prosody, lexical relevance, and candidate confidence:'
  );

  addBullet('Qwen2-Audio-7B-Instruct', '7-Billion parameter multimodal audio-language model. Employs direct audio token comprehension to evaluate STAR structural adherence (Situation, Task, Action, Result).');
  addBullet('Answer Relevance Score (0-100)', 'Quantifies alignment between the candidate response and the selected interview prompt.');
  addBullet('Keyword Coverage Score (0-100)', 'Evaluates density and contextual accuracy of domain-specific terminology (e.g., distributed systems, KPIs, conflict resolution).');
  addBullet('Librosa Vocal Pacing (WPM)', 'Extracts energy onset envelopes to count spoken syllables and calculate empirical Words Per Minute, benchmarked against the target 130-160 WPM executive range.');
  addBullet('Pydub Silence Tracking (>1.5s)', 'Scans acoustic signal using sliding window RMS energy to identify silent gaps exceeding 1.5 seconds, highlighting hesitation zones on the pacing timeline.');
  addBullet('Verbatim Transcript & Fillers', 'Generates high-accuracy transcript while cataloging verbal crutches ("um", "uh", "like", "you know") with exact frequency counts.');

  // ---------------------------------------------------------
  // PAGE 3: DASHBOARD METRICS & LOCAL DEPLOYMENT
  // ---------------------------------------------------------
  doc.addPage();
  y = 18;

  addSectionTitle('5. Phase 4: Executive Performance Dashboard Layout', 'UI / UX Lead');
  addParagraph(
    'The production dashboard translates raw multi-modal diagnostics into high-signal executive visualizations designed for hiring managers and candidate self-coaching:'
  );

  addBullet('Top Row Executive Summary Cards', 'Overall Score (/100), Answer Relevance (%), Eye Contact Score (%), Words Per Minute (WPM), and Filler Word Count.');
  addBullet('Performance Radar Chart (Plotly)', '6-axis radar polygon comparing candidate performance against industry hire benchmarks across Relevance, Keywords, Structure, Eye Contact, Tone, and Vocal Pacing.');
  addBullet('Emotion Distribution Donut Chart', 'Visualizes session composure breakdown with dominant affective demeanor annotation.');
  addBullet('Audio Pacing & Pause Timeline', 'Waveform line chart with red-shaded bounding boxes flagging hesitation gaps exceeding 1.5 seconds.');
  addBullet('Candidate Feedback Panel', 'Expandable transcript with highlighted filler words, paired with structured Key Strengths and Actionable Suggestions for Improvement.');

  addSectionTitle('6. Hugging Face Activation & Local Execution Guide', 'Setup & Secrets');

  addCalloutBox(
    'Activating Live Hugging Face GPU Inference (Optional)',
    [
      '1. Create a free Access Token at huggingface.co/settings/tokens (Role: Read).',
      '2. In the Streamlit Sidebar: Paste token into "Hugging Face Token" field.',
      '3. In Terminal: Set export HF_TOKEN="hf_your_token_here" before running app.py.',
      '4. Note: If token is omitted, the app uses calibrated offline inference automatically.',
    ],
    [240, 253, 244],
    [187, 247, 208]
  );

  addParagraph('Execute the complete Python Streamlit application locally on your workstation:');

  addBullet('1. Clone / Navigate', 'cd interview-analyzer-workspace');
  addBullet('2. Install Dependencies', 'pip install -r requirements.txt (Streamlit, OpenCV, MediaPipe, Librosa, Plotly, Requests)');
  addBullet('3. Launch Streamlit', 'streamlit run app.py (Opens dashboard at http://localhost:8501)');

  // Footer for each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      `AI Interview Performance Analyzer • Confidential Technical Documentation`,
      margin,
      pageHeight - 7
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - doc.getTextWidth(`Page ${i} of ${totalPages}`),
      pageHeight - 7
    );
  }

  // Trigger browser download
  doc.save('AI_Interview_Analyzer_System_Documentation.pdf');
};
