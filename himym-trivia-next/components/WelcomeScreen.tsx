'use client';

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  return (
    <div id="welcome" className="screen active">
      <div className="umbrella">☂️</div>

      <div className="welcome-title">
        <h1>How I Met Your Mother<br />Trivia Challenge</h1>
        <p className="sub">MacLaren&apos;s Pub Edition</p>
      </div>

      <div className="divider" />

      <p className="tagline">
        Pull up a stool at <strong>MacLaren&apos;s</strong>.<br />
        This is gonna be <strong>legen— wait for it —dary!</strong>
      </p>

      <div className="stat-row">
        <div className="stat">
          <span className="sv">10</span>
          <span className="sl">Questions</span>
        </div>
        <div className="stat">
          <span className="sv">☂️</span>
          <span className="sl">Glory</span>
        </div>
      </div>

      <div className="cta-arrow">▼</div>

      <button className="btn btn-gold" onClick={onStart}>
        ☂️&nbsp;&nbsp;Start the Challenge
      </button>
    </div>
  );
}
