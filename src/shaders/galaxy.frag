uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

#define PI 3.14159265359

float hash(vec2 p)
{
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);

    return fract(p.x * p.y);
}

float noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(
        mix(a, b, f.x),
        mix(c, d, f.x),
        f.y
    );
}

float fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;

    for(int i = 0; i < 6; i++)
    {
        v += noise(p) * a;
        p *= 2.0;
        a *= 0.5;
    }

    return v;
}

vec3 starField(vec2 uv)
{
    float n1 = fbm(uv * 12.0);
    float n2 = fbm(uv * 25.0 + 15.0);
    float n3 = fbm(uv * 45.0 - 5.0);

    float stars =
        smoothstep(
            0.72,
            0.95,
            n1 * n2 * n3
        );

    vec3 col = vec3(
        n1,
        n2 * 0.8,
        n3 * 1.4
    );

    return col * stars * 8.0;
}

void main()
{
    vec2 uv =
        (gl_FragCoord.xy - 0.5 * uResolution)
        / uResolution.y;

    vec2 mouse =
        uMouse * 2.0;

    float dist =
        length(uv);

    vec2 p = uv;

    float angle =
        dist * 2.8
        -
        uTime * 0.15;

    float c = cos(angle);
    float s = sin(angle);

    mat2 rot =
        mat2(
            c,-s,
            s, c
        );

    p *= rot;

    p += mouse * 0.15;

    p *= 3.0;

    float galaxy =
        fbm(
            p
            +
            sin(uTime * 0.05)
        );

    float core =
        pow(
            max(
                0.0,
                1.3 - dist
            ),
            5.0
        );

    galaxy *= core;

    vec3 centerColor =
        mix(
            vec3(1.0,0.6,0.3),
            vec3(0.4,0.5,1.0),
            0.5
            +
            0.5 *
            sin(
                uTime * 0.2
            )
        );

    vec3 galaxyColor =
        centerColor
        *
        galaxy
        *
        3.0;

    vec3 stars =
        starField(
            gl_FragCoord.xy
            *
            0.01
        );

    vec3 color =
        stars
        +
        galaxyColor;

    color +=
        vec3(
            0.05,
            0.07,
            0.12
        );

    float vignette =
        1.0
        -
        dot(
            uv,
            uv
        ) * 0.4;

    color *= vignette;

    gl_FragColor =
        vec4(
            color,
            1.0
        );


float crosshair =
    smoothstep(
        0.01,
        0.0,
        abs(uv.x)
    )
    +
    smoothstep(
        0.01,
        0.0,
        abs(uv.y)
    );

color += vec3(crosshair);
}