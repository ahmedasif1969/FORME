export const heroChapters = [
  { lines: ['THE ART OF', 'CONSIDERED', 'LIVING'], caption: ['Architecture in harmony.', 'Life, beautifully considered.'], label: 'A considered beginning' },
  { lines: ['SHAPED BY', 'THE', 'LANDSCAPE'], caption: ['Follow the contours.', 'Let the landscape lead.'], label: 'A dialogue with place' },
  { lines: ['A PLACE', 'TO', 'BELONG.'], caption: ['Light. Material. A sense of home.', 'Made for the life within.'], label: 'A place of your own' },
];

export default function HeroStory() {
  return <>
    <h1 className="sr-only">The art of considered living. Shaped by the landscape. A place to belong.</h1>
    <div className="hero-story" aria-hidden="true">
      {heroChapters.map((chapter, i) => <div className="hero-chapter" key={chapter.label} data-chapter={i}>
        <div className="hero-title">{chapter.lines.map(line => <div className="hero-line" key={line}><span>{line}</span></div>)}</div>
        <div className="hero-caption"><span className="caption-line"/>{chapter.caption[0]}<br/>{chapter.caption[1]}</div>
      </div>)}
      <div className="story-index">{heroChapters.map((chapter, i) => <div className="story-step" key={chapter.label}><span>0{i + 1}</span><span className="story-step-label">{chapter.label}</span><i/></div>)}</div>
    </div>
  </>;
}
