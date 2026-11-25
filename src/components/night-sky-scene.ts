const scenes = {
  home: { seed: 73, stars: 1160, snow: 0, dust: 0 },
  aurora: { seed: 148, stars: 1030, snow: 0, dust: 0 },
  case: { seed: 281, stars: 960, snow: 0, dust: 72 },
  casePending: { seed: 289, stars: 980, snow: 0, dust: 48 },
  podcast: { seed: 136, stars: 1120, snow: 0, dust: 0 },
  collaborate: { seed: 545, stars: 1060, snow: 0, dust: 0 },
  about: { seed: 415, stars: 1000, snow: 122, dust: 0 },
  shop: { seed: 617, stars: 980, snow: 0, dust: 0 },
  contact: { seed: 631, stars: 970, snow: 0, dust: 0 },
  privacy: { seed: 809, stars: 930, snow: 0, dust: 0 },
  terms: { seed: 823, stars: 935, snow: 0, dust: 0 },
  lost: { seed: 391, stars: 1050, snow: 0, dust: 0 },
} as const;

export type SkyVariant = keyof typeof scenes;
type Context = CanvasRenderingContext2D;
type Particle = { x: number; y: number; size: number; rate: number; phase: number; power: number };
type Meteor = { start: number; duration: number; x: number; y: number; length: number };
type AuroraBand = { fill: CanvasGradient; rays: CanvasGradient; edge: string; phase: number; wave: Float32Array };

const phases = 12;
const starDepth = [0.1, 0.46, 0.83];
const starColors = ["#c6d9ff", "#d5ddff", "#edf6ff"];
const starPower = [.62, .83, 1];

function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function sprite(color: string, soft: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  const glow = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  const stops = soft ? [1, .61, .16, 0] : [1, .9, .31, 0];
  [0, .33, .69, 1].forEach((stop, index) => {
    glow.addColorStop(stop, color + Math.round(stops[index] * 255).toString(16).padStart(2, "0"));
  });
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 96, 96);
  return canvas;
}

function auroraBands(ctx: Context, width: number, height: number): AuroraBand[] {
  return ["#8ec6ff", "#b6a7ff", "#88aaf9"].map((color, index) => {
    const fill = ctx.createLinearGradient(0, height * .30, 0, height);
    fill.addColorStop(0, color + "00");
    fill.addColorStop(.25, color + "0a");
    fill.addColorStop(.63, color + "43");
    fill.addColorStop(.88, color + "67");
    fill.addColorStop(1, color + "10");
    const rays = ctx.createLinearGradient(0, height * .22, 0, height * .94);
    rays.addColorStop(0, color + "00");
    rays.addColorStop(.42, color + "04");
    rays.addColorStop(.78, color + "55");
    rays.addColorStop(1, color + "34");
    return { fill, rays, edge: color + "96", phase: index * 1.48,
      wave: new Float32Array(width < 650 ? 57 : 89) };
  });
}

function paintAurora(ctx: Context, bands: AuroraBand[], width: number, height: number, time: number, reduced: boolean) {
  const sway = reduced ? time * .15 : time;
  for (const [index, band] of bands.entries()) {
    const steps = band.wave.length - 1;
    const stepWidth = (width + 48) / steps;
    const level = .79 - index * .05;
    for (let step = 0; step <= steps; step++) {
      const u = step / steps;
      band.wave[step] = height * (level + .095 * Math.sin(6.4 * u - sway * .51 + band.phase)
        + .045 * Math.sin(13 * u + sway * .68 + band.phase));
    }
    ctx.globalAlpha = .76 + .22 * Math.sin(time * (reduced ? .64 : 1.32) + band.phase);
    ctx.fillStyle = band.fill;
    ctx.beginPath();
    ctx.moveTo(-24, height * .29);
    ctx.lineTo(width + 24, height * .29);
    for (let step = steps; step >= 0; step--) ctx.lineTo(-24 + stepWidth * step, band.wave[step]);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    for (let step = 0; step <= steps; step++) ctx.lineTo(-24 + stepWidth * step, band.wave[step]);
    ctx.strokeStyle = band.edge;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = -24 + stepWidth * i;
      const end = band.wave[i];
      const arc = Math.sin(u * 43 + band.phase - sway * 1.1);
      ctx.moveTo(x + height * (.13 + arc * .05), end - height * (.21 + .12 * arc));
      ctx.lineTo(x, end - 1);
    }
    ctx.strokeStyle = band.rays;
    ctx.lineWidth = width < 650 ? 1.05 : 1.35;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

const rainbowColors = ["#9ac6ff", "#c0e6ff", "#e3f3ff", "#d8d0ff", "#b5a2fa", "#9aabff"];

function paintRainbow(ctx: Context, halo: HTMLCanvasElement, width: number, height: number, time: number, reduced: boolean) {
  const compact = width < 650;
  const centerX = width * (compact ? .75 : .72);
  const centerY = height * 1.14;
  const radiusX = width * (compact ? .62 : .29);
  const radiusY = height * .86;
  const spacing = compact ? 3.3 : 5.7;
  const breathe = time * (reduced ? .48 : 1);

  ctx.strokeStyle = "#a4b5ff";
  ctx.globalAlpha = .09;
  ctx.lineWidth = spacing * 8;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, -.03, Math.PI * 1.05, Math.PI * 1.96);
  ctx.stroke();
  for (const [index, color] of rainbowColors.entries()) {
    ctx.globalAlpha = .27 + .24 * (.5 + .5 * Math.sin(breathe * 1.7 - index * .62));
    ctx.strokeStyle = color;
    ctx.lineWidth = spacing * .92;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX - spacing * index, radiusY - spacing * index, -.03, Math.PI * 1.05, Math.PI * 1.96);
    ctx.stroke();
  }
  if (reduced) return;

  const phase = (time + .8) % 4.9 / 4.9;
  const angle = Math.PI * (1.1 + .84 * phase);
  const x = centerX + Math.cos(angle) * (radiusX - spacing * 2);
  const y = centerY + Math.sin(angle) * (radiusY - spacing * 2);
  ctx.globalAlpha = .34 * Math.sin(Math.PI * phase);
  ctx.drawImage(halo, x - 24, y - 24, 48, 48);
}

function windGradient(ctx: Context, width: number) {
  const gradient = ctx.createLinearGradient(width * .12, 0, width * 1.06, 0);
  gradient.addColorStop(0, "#b8d9ff00");
  gradient.addColorStop(.48, "#9acaffb3");
  gradient.addColorStop(.78, "#e2efff");
  gradient.addColorStop(1, "#acc5ff00");
  return gradient;
}

function paintWind(ctx: Context, gradient: CanvasGradient, width: number, height: number, time: number, reduced: boolean) {
  const motion = time * (reduced ? .32 : 1);
  ctx.strokeStyle = gradient;
  ctx.lineCap = "round";
  for (let strand = 0; strand < 8; strand++) {
    const phase = strand * 1.86;
    const axis = height * (.31 + strand * .081);
    const rise = height * (.04 + strand % 3 * .015);
    const length = .16 + (strand % 4) * .057;
    const progress = ((motion * (.17 + (strand % 3) * .036) + strand * .133 + .32) % 1.25) - .16;
    const at = (u: number) => axis - height * .18 * u + rise * Math.sin(u * 9 - motion * .61 + phase);
    const tail = progress - length;
    ctx.globalAlpha = .14 + (strand % 3) * .13;
    ctx.lineWidth = strand % 3 === 0 ? 2.1 : 1;
    ctx.beginPath();
    ctx.moveTo(width * tail, at(tail));
    for (let step = 1; step <= 18; step++) {
      const u = tail + length * step / 18;
      ctx.lineTo(width * u, at(u));
    }
    ctx.stroke();
    ctx.globalAlpha *= .46;
    ctx.lineWidth = .65;
    ctx.beginPath();
    ctx.moveTo(width * (tail + .025), at(tail + .025) + 5);
    for (let step = 1; step <= 16; step++) {
      const u = tail + .025 + length * step / 18;
      ctx.lineTo(width * u, at(u) + 5);
    }
    ctx.stroke();
  }
}

function paintConstellation(ctx: Context, halo: HTMLCanvasElement, width: number, height: number, time: number) {
  const points = [[.54, .68], [.63, .37], [.71, .49], [.78, .28], [.86, .47], [.93, .35]];
  ctx.globalAlpha = .14 + .09 * (.5 + .5 * Math.sin(time * .86));
  ctx.strokeStyle = "#b4cfff";
  ctx.lineWidth = .85;
  ctx.beginPath();
  for (const [x, y] of points) ctx.lineTo(x * width, y * height);
  ctx.stroke();
  ctx.fillStyle = "#e5f0ff";
  for (const [index, [x, y]] of points.entries()) {
    ctx.globalAlpha = .46 + .34 * (.5 + .5 * Math.sin(time * 1.1 + index * 1.45));
    ctx.drawImage(halo, x * width - 8, y * height - 8, 16, 16);
    ctx.beginPath();
    ctx.arc(x * width, y * height, 1.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintMoon(ctx: Context, halo: HTMLCanvasElement, width: number, height: number, time: number, reduced: boolean) {
  const radius = Math.min(width * .13, height * .26, 62);
  ctx.translate(width * .80, height * .49 + (reduced ? 0 : Math.sin(time * .48) * 6));
  ctx.globalAlpha = .24 + .12 * Math.sin(time * .62);
  ctx.drawImage(halo, -radius * 2.25, -radius * 2.25, radius * 4.5, radius * 4.5);
  ctx.globalAlpha = .71 + .16 * Math.sin(time * .62);
  ctx.fillStyle = "#daeaff";
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.bezierCurveTo(-1.03 * radius, -radius, -1.29 * radius, .43 * radius, -.29 * radius, .94 * radius);
  ctx.bezierCurveTo(.33 * radius, 1.15 * radius, .89 * radius, .76 * radius, .99 * radius, .35 * radius);
  ctx.bezierCurveTo(.17 * radius, .76 * radius, -.7 * radius, .01 * radius, 0, -radius);
  ctx.fill();
}

function paintOrbit(ctx: Context, halo: HTMLCanvasElement, width: number, height: number, time: number, reduced: boolean) {
  const rx = width * (width < 650 ? .29 : .205);
  const ry = height * .23;
  const phase = reduced ? -.85 : time * .86 - .85;
  ctx.translate(width * .76, height * .51);
  ctx.rotate(-.19);
  ctx.globalAlpha = .31;
  ctx.strokeStyle = "#a4c8ff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  const x = Math.cos(phase) * rx;
  const y = Math.sin(phase) * ry;
  ctx.globalAlpha = .67 + Math.sin(time * 1.5) * .15;
  ctx.drawImage(halo, x - 15, y - 15, 30, 30);
  ctx.fillStyle = "#eef6ff";
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function meteorSchedule(random: () => number) {
  const entries: Meteor[] = [];
  let start = -.16;
  let burst = 0;
  while (start < 44.5) {
    const count = burst % 4 === 1 ? 2 + Number(burst % 8 === 5) : 1;
    const x = .58 + random() * .36;
    for (let i = 0; i < count; i++) {
      entries.push({ start: start + i * .16, duration: .53 + random() * .44, x: x + i * .035,
        y: .10 + random() * .17 + i * .055, length: .10 + random() * .15 });
    }
    burst++;
    start += 1.18 + random() * 1.35;
  }
  return entries;
}

function lightTrail(ctx: Context, halo: HTMLCanvasElement, x: number, y: number, size: number, alpha: number, comet: boolean) {
  const tail = size * (comet ? .22 : .33);
  const stroke = ctx.createLinearGradient(x, y, x + size, y - tail);
  stroke.addColorStop(0, "#eff7ff");
  stroke.addColorStop(.19, comet ? "#a7ceffb2" : "#b5cdffae");
  stroke.addColorStop(1, "#aab8ff00");
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = comet ? 1.6 : 1.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + size * .28, y - tail * .35, x + size, y - tail);
  ctx.stroke();
  const radius = comet ? 19 : 8;
  ctx.globalAlpha = alpha * .6;
  ctx.drawImage(halo, x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#f2f8ff";
  ctx.fillRect(x - 1, y - 1, comet ? 3 : 2, comet ? 3 : 2);
  ctx.globalAlpha = 1;
}

export function makeSkyScene(ctx: Context, front: Context, variant: SkyVariant, width: number, height: number, caseNumber: number) {
  const spec = scenes[variant];
  const mobile = width < 650;
  const count = mobile ? 400 : spec.stars;
  const random = seededRandom(spec.seed + caseNumber * 1093);
  const particle = (): Particle => ({ x: random(), y: random(), size: random(), rate: .85 + random() * 2.4,
    phase: random() * Math.PI * 2, power: .49 + random() * .51 });
  const farCount = Math.floor(count * .65);
  const midCount = Math.floor(count * .25);
  const layers = [farCount, midCount, count - farCount - midCount].map((amount, depth) => Array.from({ length: amount }, () => {
    const p = particle();
    return { ...p, x: p.x * width, y: p.y * height, size: (.55 + depth * .52 + p.size * (.45 + depth * .21)) * (depth === 2 ? .54 : 1) };
  }));
  const buckets: Particle[][] = Array.from({ length: phases }, () => []);
  const snow = Array.from({ length: Math.round(spec.snow * (mobile ? .53 : 1)) }, particle);
  const dust = Array.from({ length: Math.round(spec.dust * (mobile ? .54 : 1)) }, particle);
  const bokeh = Array.from({ length: mobile ? 9 : 16 }, () => {
    const p = particle();
    return { ...p, x: .41 + p.x * .61, y: .10 + p.y * .88 };
  });
  const bright = layers[2].filter((star) => star.x > width * .48 && star.size > 1.04).slice(0, mobile ? 5 : 10);
  const halo = sprite("#8fbaff", true);
  const bokehSprites = ["#94b7ef", "#b6a6ed"].map((color) => [sprite(color, true), sprite(color, false)]);
  const bands = variant === "aurora" ? auroraBands(ctx, width, height) : [];
  const wind = variant === "contact" ? windGradient(ctx, width) : undefined;
  const meteors = variant === "podcast" ? meteorSchedule(random) : [];
  const overlay = variant === "case";
  const dustAngle = caseNumber * 2.39996;
  const dustX = Math.cos(dustAngle) * 13;
  const dustY = Math.sin(dustAngle) * 10;

  function paintMiddle(time: number, reduced: boolean, x: number, y: number) {
    ctx.save();
    ctx.translate(x * .42, y * .42);
    switch (variant) {
      case "aurora": paintAurora(ctx, bands, width, height, time, reduced); break;
      case "shop": paintRainbow(ctx, halo, width, height, time, reduced); break;
      case "contact": if (wind) paintWind(ctx, wind, width, height, time, reduced); break;
      case "privacy": paintConstellation(ctx, halo, width, height, time); break;
      case "terms": paintMoon(ctx, halo, width, height, time, reduced); break;
      case "lost": paintOrbit(ctx, halo, width, height, time, reduced); break;
    }
    ctx.restore();
  }

  return (time: number, reduced: boolean, x: number, y: number) => {
    ctx.clearRect(0, 0, width, height);
    if (front !== ctx) front.clearRect(0, 0, width, height);
    const focusAge = time % 13.2 - 11.1;
    const focus = !reduced && focusAge > 0 ? Math.sin(Math.PI * Math.min(focusAge / 2.1, 1)) ** 2 : 0;
    const starlight = time * (reduced ? .66 : 1);
    const shade = overlay ? .38 : variant === "collaborate" ? .84 : 1;
    for (const [depth, stars] of layers.entries()) {
      const layer = depth === 2 ? front : ctx;
      if (depth === 2) paintMiddle(time, reduced, x, y);
      for (const bin of buckets) bin.length = 0;
      for (const star of stars) {
        const twinkle = .3 + .7 * (.5 + .5 * Math.sin(star.phase + starlight * star.rate));
        buckets[Math.round(twinkle * (phases - 1))].push(star);
      }
      layer.save();
      layer.translate(x * starDepth[depth], y * starDepth[depth]);
      layer.fillStyle = starColors[depth];
      for (const [brightness, bin] of buckets.entries()) {
        if (!bin.length) continue;
        layer.globalAlpha = shade * starPower[depth] * (brightness / (phases - 1)) * (1 - (depth === 0 ? focus * .14 : 0));
        layer.beginPath();
        if (depth === 2) {
          for (const star of bin) {
            const px = (star.x + (reduced ? 0 : time * (1.1 + star.power * 1.5))) % width;
            const py = star.y + (reduced ? 0 : Math.sin(star.phase + time * .42) * 4);
            layer.moveTo(px + star.size, py);
            layer.arc(px, py, star.size, 0, Math.PI * 2);
          }
        } else {
          const softness = depth === 0 ? focus * .24 : 0;
          for (const star of bin) layer.rect(star.x, star.y, star.size + softness, star.size + softness);
        }
        layer.fill();
      }
      layer.restore();
    }

    for (const star of bright) {
      const px = (star.x + (reduced ? 0 : time * (1.1 + star.power * 1.5))) % width + x * .83;
      const py = star.y + y * .83 + (reduced ? 0 : Math.sin(star.phase + time * .42) * 4);
      front.globalAlpha = (.24 + .47 * (.5 + .5 * Math.sin(starlight * star.rate + star.phase))) * shade;
      front.drawImage(halo, px - 7, py - 7, 14, 14);
      front.fillStyle = "#d8e9ff";
      front.fillRect(px - 3.1, py - .34, 6.2, .68);
      front.fillRect(px - .34, py - 4.2, .68, 8.4);
    }

    for (const [particles, falling] of [[snow, true], [dust, false]] as const) {
      const drift = time * (reduced ? .36 : 1);
      front.fillStyle = "#edf5ff";
      for (const p of particles) {
        const speedY = falling ? 11 + p.power * 30 : dustY * p.power;
        const speedX = falling ? 0 : dustX * p.power;
        const py = (((p.y * height + drift * speedY) % height) + height) % height + y * .54;
        const px = (((p.x * width + drift * speedX) % width) + width) % width
          + Math.sin(p.phase + drift * (.64 + p.size)) * (falling ? 13 : 6) + x * .54;
        const radius = .48 + p.size * (falling ? 2 : 1.1);
        front.globalAlpha = (falling ? .29 : .20) + p.power * (falling ? .56 : .42);
        front.beginPath();
        front.arc(px, py, radius, 0, Math.PI * 2);
        front.fill();
      }
    }

    if (!reduced) {
      const timeInCycle = time % 46;
      for (const meteor of meteors) {
        const progress = (timeInCycle - meteor.start) / meteor.duration;
        if (progress < 0 || progress >= 1) continue;
        const alpha = Math.min(1, progress * 5, (1 - progress) * 4.8);
        const travel = Math.min(width * .46, 510);
        lightTrail(front, halo, width * meteor.x - travel * progress + x * .45,
          height * meteor.y + travel * .33 * progress + y * .45, Math.min(width * meteor.length, 225), alpha, false);
      }
      if (variant === "home") {
        const progress = ((time + .93) % 9.7) / 3.65;
        if (progress < 1) lightTrail(front, halo, width * (.94 - progress * .58) + x * .47,
          height * (.11 + progress * .26) + y * .47, Math.min(width * .33, 435),
          Math.min(1, progress * 6, (1 - progress) * 4.2), true);
      }
    }

    for (const [index, p] of bokeh.entries()) {
      const drift = reduced ? 0 : time;
      const centerX = p.x * width + Math.sin(drift * .25 + p.phase) * 16 + x;
      const centerY = p.y * height + Math.sin(drift * .17 + p.phase) * 12 + y;
      const size = (mobile ? 15 : 20) + p.size * (mobile ? 30 : 43);
      const alpha = (.045 + p.power * (overlay ? .13 : .19)) * (centerX > width * .51 ? 1 : .55);
      const [soft, tighter] = bokehSprites[index % bokehSprites.length];
      front.globalAlpha = alpha * (1 - focus * .62);
      front.drawImage(soft, centerX - size / 2, centerY - size / 2, size, size);
      if (focus > .02) {
        front.globalAlpha = alpha * focus * .64;
        front.drawImage(tighter, centerX - size / 2, centerY - size / 2, size, size);
      }
    }
    front.globalAlpha = 1;
  };
}
