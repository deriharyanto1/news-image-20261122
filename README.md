# The World Today — 22 November 2026

[![make.fun](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122)
[![Rank](https://make.fun/badge/news-image-20261122/deriharyanto1/news-image-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122)
[![Reward](https://make.fun/badge/news-image-20261122/deriharyanto1/news-image-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122)

A one-page newspaper front page summing up the world's news of **Sunday 22 November 2026** — an entry for the [make.fun bounty news-image-20261122](https://make.fun/bounty/news-image-20261122).

## What's inside

43 stories from 9 regions around the world, drawn by a program written for this entry:

- **Top story:** COP31 climate talks in Antalya go into a second day of overtime over fossil fuels — "a good deal or no deal".
- **Eight panels:** the missile strike on Kryvyi Rih, the burning cargo ship in the Gulf of Finland, Poland's airspace violation, Iran's strike on Bahrain, the capture of cartel boss "El Chapo Isidro" in Mexico, Hong Kong's Election Committee polls (89.81% turnout by 1 pm), the US stock correction, and the EU–Indonesia trade deal.
- **In brief:** 33 one-line briefs across 9 regions — Europe, the Middle East and the Gulf, North America, Latin America, East Asia, South Asia, Southeast Asia, Africa and Oceania — from the UN's "killer robots" pact to the Basra power station fire, India's one-crore HPV milestone, the African Group's COP31 verdict and Australia's AUKUS reply.
- A quote box: the EU official's line at COP31.

## How it works

`main.ts` (Node 22, standard library only) draws the whole front page with a hand-rolled vector stroke font and a hand-rolled PNG encoder — no network, no external assets. It writes one 1024×1024 PNG to `/output/entry.png`, and two runs produce byte-identical output.

Run it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
