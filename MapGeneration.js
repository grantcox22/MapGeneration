import React, { useEffect, useRef } from 'react'
import { ReactComponent as Logo } from '../../assets/logo.svg';
import './style.css';
import SimplexNoise from 'perlin-simplex';

const RANDOM_INITIAL_RANGE = 15;


function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function index(x, y, width) {
    return width * x + y;
}

function perlinNoise(tiles, size) {

    var simplex = new SimplexNoise();

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            tiles[index(x, y, size)] = 0;
            let frequency = 0.002;
            let amplitude = 16;
            for (let i = 0; i < 20; i++) {
                tiles[index(x, y, size)] += simplex.noise(x * frequency, y * frequency) * amplitude;
                frequency *= 2.5;
                amplitude /= 2;
            }
        }
    }
}

function diamondSquare(tiles, size) {
    tiles[index(0, size - 1, size)] = randomInRange(0, RANDOM_INITIAL_RANGE);
    tiles[index(0, 0, size)] = randomInRange(0, RANDOM_INITIAL_RANGE);
    tiles[index(size - 1, 0, size)] = randomInRange(0, RANDOM_INITIAL_RANGE);
    tiles[index(size - 1, size - 1, size)] = randomInRange(0, RANDOM_INITIAL_RANGE);

    let chunckSize = size - 1;
    let randomFactor = RANDOM_INITIAL_RANGE;

    while (chunckSize > 1) {
        diamond(chunckSize, randomFactor);
        square(chunckSize, randomFactor);
        chunckSize /= 2;
        randomFactor /= 2;
    }

    function diamond(chunkSize, randomFactor) {
        for (let i = 0; i < size - 1; i += chunkSize) {
            for (let j = 0; j < size - 1; j += chunkSize) {
              const BOTTOM_RIGHT = tiles[index(j + chunkSize, i + chunkSize, size)];
              const BOTTOM_LEFT = tiles[index(j + chunkSize, i, size)];
              const TOP_LEFT = tiles[index(j, i, size)];
              const TOP_RIGHT = tiles[index(j, i + chunkSize, size)];
              const { count, sum } = [
                BOTTOM_RIGHT,
                BOTTOM_LEFT,
                TOP_LEFT,
                TOP_RIGHT
              ].reduce(
                (result, value) => {
                  if (isFinite(value) && value != null) {
                    result.sum += value;
                    result.count += 1;
                  }
                  return result;
                },
                { sum: 0, count: 0 }
              );
              const changed = {row: j + chunkSize / 2, column: i + chunkSize / 2};
              tiles[index(changed.row, changed.column, size)] =
                (sum / count + randomInRange(-randomFactor, randomFactor));
            }
          }
    }

    function square(chunkSize, randomFactor) {
        const half = chunkSize / 2;
        for (let y = 0; y < size; y += half) {
          for (let x = (y + half) % chunkSize; x < size; x += chunkSize) {
            const BOTTOM = tiles[index(y + half, x, size)];
            const LEFT = tiles[index(y, x - half, size)];
            const TOP = tiles[index(y - half, x, size)];
            const RIGHT = tiles[index(y, x + half, size)];
            const { count, sum } = [BOTTOM, LEFT, TOP, RIGHT].reduce(
              (result, value) => {
                if (isFinite(value) && value != null) {
                  result.sum += value;
                  result.count += 1;
                }
                return result;
              },
              { sum: 0, count: 0 }
            );
            tiles[index(y,x,size)] = (sum / count + randomInRange(-randomFactor, randomFactor));
          }
        }
    }
}

class Map {
    constructor(N, tileWidth) {
        this.size = Math.pow(2, N) + 1;
        this.tileWidth = tileWidth;
        this.tiles = new Array(this.size * this.size).fill(0);
        this.genType = "diamond-square";
    }

    generate(form) {
        this.genType = form.gen.value;
        if (this.genType == "diamond-square") {
            diamondSquare(this.tiles, this.size);
        } else {
            perlinNoise(this.tiles, this.size);
        }
    }

    draw(ctx, cameraOffset) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let x = (i * this.tileWidth) + cameraOffset.x
                let y = (j * this.tileWidth) + cameraOffset.y
                if (x > -6 && x < window.innerWidth && y > -6 && y < window.innerHeight) {
                    ctx.fillStyle = this.color(index(i, j, this.size));
                    ctx.fillRect(x, y, this.tileWidth, this.tileWidth);
                }
            }
        }
    }

    color(index) {
        let height = this.tiles[index]; 
        if (height <= 0) return "#082e4f";
        else if (height <= 2) return "#0c3a61";
        else if (height <= 4) return "#0e4878";
        else if (height <= 5) return "#146db8";
        else if (height <= 6) return "#009dc4";
        else if (height <= 6.5) return "#ebe98f";
        else if (height <= 7) return "#edeb80";
        else if (height <= 10) return "#058503";
        else if (height <= 12) return "#126e10";
        else if (height <= 13) return "#144f09";
        else if (height <= 16) return "#422a00";
        else if (height <= 18) return "#3b3731"
        else return "#fff";
    }
}

export default function MapGeneration() {

    const canvasRef = useRef(null);
    const ctx = useRef(null);
    const form = useRef(null);
    const map = useRef(new Map(9, 6));

    let cameraOffset = { x: Math.floor(-window.innerWidth / 2), y:  Math.floor(-window.innerHeight / 2)};
    let mouse = {x : undefined, y : undefined};
    let prev = mouse;
    let click = false;

    function mousemove(e) {
        prev = mouse;
        mouse = {x : e.pageX, y : e.pageY};
        if (click) {
            cameraOffset.x += (mouse.x - prev.x)
            cameraOffset.y += (mouse.y - prev.y)
        };
    }
    
    function mousedown(e) {
        click = true;
    }

    function mouseup(e) {
        click = false;
    }

    useEffect(() => {
        const canvas = canvasRef.current;

        const context = canvas.getContext('2d');
        context.canvas.width = window.innerWidth;
        context.canvas.height = window.innerHeight;

        ctx.current = context;

        let can = document.querySelector(".canvas");

        can.onmousemove = mousemove;
        can.onmousedown = mousedown;
        can.onmouseup = mouseup;
        can.onmouseout = () => {
            click = false;
        }

        map.current.generate(form.current);
        animate();

    })

    function animate() {

        ctx.current.clearRect(0, 0, window.innerWidth, window.innerHeight);
        map.current.draw(ctx.current, cameraOffset);

        requestAnimationFrame(animate);
    }

    return (
        <>
        <canvas ref={canvasRef} className="canvas"></canvas>
        <form className="settings" ref={form}>
            <label>Gen Type</label>
            <select name={"gen"} defaultValue={"diamond-square"} onChange={() => {map.current.generate(form.current)}}>
                <option value={"diamond-square"}>Diamond Square</option>
                <option value={"perlin-noise"}>Perlin Noise</option>
            </select>
            <a href="#" onClick={() => {map.current.generate(form.current)}}>Generate</a>
            <a href="./">Article</a>
        </form>
        <a href="./"><Logo className="logo" /></a>
        </>
    );
}