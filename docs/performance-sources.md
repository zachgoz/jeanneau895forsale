# Performance assumptions and source verification

Verified against the official Yamaha bulletin on October 4, 2026. Yamaha’s published model test is the sole source for current performance copy, profiles and calculator fixtures. The calculator defaults to its 4,000 RPM efficient planing cruise. The **Cruise** profile selects Yamaha’s published 4,500 RPM row: **32.0 statute MPH, 18.9 combined GPH and 1.69 published statute MPG**. No owner-observed comparison remains.

The authoritative calculator fuel capacity is `boat.fuelCapacityGallons` in `src/data/boat.ts`, currently 158 US gallons. The reference boat’s 159-gallon model capacity does not replace the listing assumption.

## Official calculator table

[Yamaha’s September 18, 2016 NC 895 / twin F200XCA and LF200XCA bulletin](https://yamahaoutboards.com/outboards/350-150-hp/in-line-4/f200-(i4)/pb_jea_nc895_t_f200xca_2016-09-18_owa) supplies every slider anchor:

| RPM | Statute MPH | Combined GPH | Published statute MPG |
| --- | --- | --- | --- |
| 1,000 | 4.8 | 1.6 | 3.00 |
| 1,500 | 6.3 | 2.6 | 2.42 |
| 2,000 | 7.8 | 4.2 | 1.86 |
| 2,500 | 9.2 | 6.5 | 1.42 |
| 3,000 | 10.2 | 9.6 | 1.06 |
| 3,500 | 17.1 | 12.7 | 1.35 |
| 4,000 | 26.8 | 14.8 | 1.81 |
| 4,500 | 32.0 | 18.9 | 1.69 |
| 5,000 | 36.5 | 25.5 | 1.43 |
| 5,500 | 40.2 | 32.5 | 1.24 |
| 5,950 | 44.0 | 39.5 | 1.11 |

Yamaha identifies an 8,964 lb test boat, two people, 50 gallons of fuel in the load, three batteries, generator, Premiere and Comfort packages, safety/test gear, and Reliance 14½ × 15 propellers. These test figures are model references rather than measurements of EZ Livin. Loading and operating conditions can change actual performance.

The earlier Sundance dealer table and owner observations are excluded from current performance data and calculations. Every interpolation anchor comes from the same Yamaha bulletin.

## Operating points and calculation precision

The full tested range is 1,000–5,950 RPM, adjustable in 50 RPM steps. The slider marks 1,000 RPM “Trolling,” 1,500 RPM “Slow trolling,” 4,000 RPM “Efficient cruise,” and 5,950 RPM “WOT.” The additional Cruise profile uses the exact 4,500 RPM row, without changing the default or the official table. Trolling labels describe low-speed examples, not a Yamaha recommendation. Among planing-speed rows, 4,000 RPM has the highest fuel economy. The highest economy overall is the 1,000 RPM row.

Published MPG is stored and displayed as `publishedMpg`; calculation MPG is MPH/GPH to keep trip time and fuel burn mathematically consistent despite published rounding. Intermediate RPM values linearly interpolate speed and combined burn and recompute MPG; they display “Interpolated estimate.” No out-of-range values are extrapolated.

One nautical mile is 1.15078 statute miles. Usable gallons equal capacity × (1 − reserve fraction). Range equals usable gallons × calculation MPG; running hours equal usable gallons ÷ GPH. With 158 gallons and 10% reserve, the default 4,000 RPM estimate is 142.2 usable gallons, about 257.5 statute miles, 223.8 NM and 9.61 hours.

## Place-to-place planner

Seven coastal places are selectable for departure and destination, with named approaches and explicit approximate water-route assumptions. See `docs/cruise-route-sources.md`. One-way/round-trip controls generate a total distance; manual entry (0.1–500 NM) overrides that total without additional doubling. Route changes reset the override. Swap reverses endpoints while preserving the modeled distance.

The separate **Manual distance** option accepts a standalone 0.1–500 NM total without route or destination selection. Include any return leg in the total. Manual and place-to-place distances are preserved independently across mode changes, and the destination round-trip setting does not multiply a manual total. Both modes use the same selected Yamaha performance and reserve assumptions.

Trip math uses total planned NM. Reserve gallons remain based on full capacity. Remaining reserve-protected range is clamped to zero; a trip exceeding full capacity separately reports its fuel shortfall. Status thresholds use the share of usable fuel required: at most 75% comfortable; above 75% fits; at least 90% near reserve; above 100% exceeds selected reserve. These describe the calculation, not voyage safety.

All estimates assume a full tank and steady operation at the chosen speed. Generator fuel, no-wake time, stops, detours and changing weather/current are not included. Distances are not navigational routes; use current charts and conditions for actual passage planning.

Slider analytics emit after pointer/keyboard completion, with duplicate blur events suppressed. Route changes, trip-type selection and swap are committed interactions; manual distance emits on blur/Enter. Events contain controlled profile/source/reserve/distance bands, no place text, exact route coordinates or contact information. Screen-reader summaries announce committed updates rather than every drag step.
