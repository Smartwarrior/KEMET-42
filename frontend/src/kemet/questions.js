// Questions éducatives adaptées aux 7–12 ans.
// Chaque bonne réponse vient d’une source officielle NASA (champ `src`).
// Phrases courtes, une seule idée, mots simples. Les termes scientifiques sont expliqués dans `why`.
import { SOURCES as S } from "./facts.js";

const q = (id, body, src, fr, en) => ({ id, body, src, fr, en });
const opt = (right, ...wrong) => ({ right, wrong });

export const QUESTIONS = [
  // —— Mars ——
  q(
    "mars_day",
    "mars",
    S.mars,
    {
      q: "Combien de temps dure une journée sur Mars ?",
      ...opt("Presque 25 heures (un Sol)", "12 heures", "30 heures", "10 jours"),
      why: "Une journée sur Mars s’appelle un Sol. Elle dure 24 heures et environ 40 minutes. C’est un peu plus long qu’une journée sur Terre.",
    },
    {
      q: "How long is a day on Mars?",
      ...opt("Almost 25 hours (a Sol)", "12 hours", "30 hours", "10 days"),
      why: "A day on Mars is called a Sol. It lasts about 24 hours and 40 minutes. A bit longer than a day on Earth.",
    }
  ),
  q(
    "mars_temp",
    "mars",
    S.mars,
    {
      q: "Il fait plutôt chaud ou froid sur Mars ?",
      ...opt("Très froid (environ −60 °C)", "Comme sur Terre", "Très chaud", "Toujours 0 °C"),
      why: "La température moyenne est d’environ −59 °C. C’est pour cela que le chauffage de la base est très important.",
    },
    {
      q: "Is Mars mostly hot or cold?",
      ...opt("Very cold (about −60 °C)", "Like on Earth", "Very hot", "Always 0 °C"),
      why: "The average temperature is about −59 °C. That is why base heating is so important.",
    }
  ),
  q(
    "mars_g",
    "mars",
    S.mars,
    {
      q: "Sur Mars, tu pèses moins ou plus que sur Terre ?",
      ...opt("Moins (environ 3 fois moins)", "Pareil", "Plus", "Tu ne pèses plus rien"),
      why: "La gravité sur Mars est plus faible : environ 38 % de celle de la Terre. Tu te sentirais plus léger.",
    },
    {
      q: "On Mars, do you weigh less or more than on Earth?",
      ...opt("Less (about 3 times less)", "The same", "More", "You weigh nothing"),
      why: "Gravity on Mars is weaker: about 38 % of Earth’s. You would feel lighter.",
    }
  ),
  q(
    "mars_co2",
    "mars",
    S.mars,
    {
      q: "Peut-on respirer l’air de Mars sans combinaison ?",
      ...opt("Non, il n’y a presque pas d’oxygène", "Oui, comme sur Terre", "Oui, la nuit seulement", "Oui, près des volcans"),
      why: "L’air de Mars est surtout du gaz carbonique (CO₂). Il y a très peu d’oxygène. Il faut une combinaison pour respirer.",
    },
    {
      q: "Can you breathe Mars air without a spacesuit?",
      ...opt("No, there is almost no oxygen", "Yes, like on Earth", "Yes, only at night", "Yes, near volcanoes"),
      why: "Mars air is mostly carbon dioxide (CO₂). There is very little oxygen. You need a spacesuit to breathe.",
    }
  ),
  q(
    "mars_moons",
    "mars",
    S.mars,
    {
      q: "Combien de lunes a Mars ?",
      ...opt("2 (Phobos et Déimos)", "0", "1", "4"),
      why: "Mars a deux petites lunes : Phobos et Déimos. Elles sont beaucoup plus petites que notre Lune.",
    },
    {
      q: "How many moons does Mars have?",
      ...opt("2 (Phobos and Deimos)", "0", "1", "4"),
      why: "Mars has two small moons: Phobos and Deimos. They are much smaller than our Moon.",
    }
  ),
  q(
    "jez_lake",
    "mars",
    S.jezero,
    {
      q: "Pourquoi le cratère Jezero est-il intéressant pour les scientifiques ?",
      ...opt("Il y avait un lac et un delta il y a longtemps", "Il est le plus chaud", "Il est parfaitement plat", "Il a déjà une base"),
      why: "La NASA a choisi Jezero parce qu’il y a très longtemps, de l’eau a formé un lac et un delta. On cherche des traces de vie passée.",
    },
    {
      q: "Why is Jezero Crater interesting to scientists?",
      ...opt("It once had a lake and a river delta", "It is the hottest place", "It is perfectly flat", "It already has a base"),
      why: "NASA chose Jezero because long ago water formed a lake and a delta. Scientists look for signs of past life.",
    }
  ),
  q(
    "gale_sharp",
    "mars",
    S.gale,
    {
      q: "Le Mont Sharp dans le cratère Gale est-il grand ?",
      ...opt("Oui, plus de 5 km de couches de roches", "Non, seulement 50 m", "Oui, plus de 100 km", "Non, 500 m"),
      why: "Le Mont Sharp est formé de couches de roches empilées sur plus de 5 km. Le rover Curiosity les étudie.",
    },
    {
      q: "Is Mount Sharp in Gale Crater tall?",
      ...opt("Yes, more than 5 km of rock layers", "No, only 50 m", "Yes, more than 100 km", "No, 500 m"),
      why: "Mount Sharp is made of rock layers stacked more than 5 km high. The Curiosity rover studies them.",
    }
  ),

  // —— Lune ——
  q(
    "moon_g",
    "moon",
    S.moon,
    {
      q: "Sur la Lune, tu pèses moins ou plus que sur Terre ?",
      ...opt("Beaucoup moins (environ 6 fois moins)", "Pareil", "Plus", "Tu flottes toujours"),
      why: "La gravité sur la Lune est environ 6 fois plus faible que sur Terre. Tu pourrais sauter plus haut !",
    },
    {
      q: "On the Moon, do you weigh less or more than on Earth?",
      ...opt("Much less (about 6 times less)", "The same", "More", "You always float"),
      why: "Gravity on the Moon is about 6 times weaker than on Earth. You could jump higher!",
    }
  ),
  q(
    "moon_dist",
    "moon",
    S.moon,
    {
      q: "À quelle distance se trouve la Lune de la Terre ?",
      ...opt("Environ 384 000 km", "38 000 km", "3 millions de km", "150 millions de km"),
      why: "La Lune est à environ 384 400 km de la Terre en moyenne. C’est la distance moyenne donnée par la NASA.",
    },
    {
      q: "How far is the Moon from Earth?",
      ...opt("About 384,000 km", "38,000 km", "3 million km", "150 million km"),
      why: "The Moon is about 384,400 km from Earth on average. That is the mean distance from NASA.",
    }
  ),
  q(
    "moon_air",
    "moon",
    S.moon,
    {
      q: "Peut-on respirer sur la Lune sans combinaison ?",
      ...opt("Non, il n’y a presque pas d’air", "Oui, la nuit", "Oui, le jour", "Oui, près des cratères"),
      why: "L’atmosphère de la Lune est extrêmement ténue : presque du vide. Il faut absolument une combinaison.",
    },
    {
      q: "Can you breathe on the Moon without a spacesuit?",
      ...opt("No, there is almost no air", "Yes, at night", "Yes, during the day", "Yes, near craters"),
      why: "The Moon’s atmosphere is extremely thin: nearly a vacuum. You must wear a spacesuit.",
    }
  ),
  q(
    "moon_temp",
    "moon",
    S.moon,
    {
      q: "Les températures sur la Lune changent-elles beaucoup ?",
      ...opt("Oui, très chaud le jour et très froid la nuit", "Non, toujours tiède", "Non, toujours glacé", "Oui, mais peu"),
      why: "À l’équateur, la température peut aller d’environ −180 °C la nuit à plus de +100 °C le jour. Les écarts sont énormes.",
    },
    {
      q: "Do temperatures on the Moon change a lot?",
      ...opt("Yes, very hot by day and very cold at night", "No, always mild", "No, always freezing", "Yes, but only a little"),
      why: "At the equator, temperature can go from about −180 °C at night to over +100 °C by day. The swings are huge.",
    }
  ),
  q(
    "art_ice",
    "moon",
    S.artemis,
    {
      q: "Pourquoi la glace d’eau sur la Lune est-elle utile ?",
      ...opt("Elle peut donner de l’oxygène et de l’hydrogène", "Pour construire des routes", "Elle bloque toutes les radiations", "Elle n’est pas utile"),
      why: "La glace d’eau peut fournir de l’oxygène pour respirer et de l’hydrogène pour le carburant. C’est très précieux pour les astronautes.",
    },
    {
      q: "Why is water ice on the Moon useful?",
      ...opt("It can give oxygen and hydrogen", "To build roads", "It blocks all radiation", "It is not useful"),
      why: "Water ice can supply oxygen to breathe and hydrogen for fuel. It is very valuable for astronauts.",
    }
  ),
  q(
    "art_sun",
    "moon",
    S.artemis,
    {
      q: "Pourquoi la NASA regarde le pôle Sud de la Lune pour Artemis ?",
      ...opt("Il y a de la lumière du Soleil presque tout le temps", "Il fait toujours nuit", "L’air y est respirable", "Il y a du réseau Internet"),
      why: "Près du pôle Sud, certaines zones reçoivent la lumière du Soleil presque en continu. C’est pratique pour l’énergie.",
    },
    {
      q: "Why does NASA look at the Moon’s South Pole for Artemis?",
      ...opt("There is sunlight almost all the time", "It is always night", "The air is breathable", "There is Internet"),
      why: "Near the South Pole, some places get sunlight almost continuously. That helps for power.",
    }
  ),
  q(
    "art_n",
    "moon",
    S.artemis,
    {
      q: "Combien de régions la NASA a-t-elle choisies pour un atterrissage Artemis ?",
      ...opt("13 régions près du pôle Sud", "3 régions", "50 régions", "100 régions"),
      why: "La NASA a identifié 13 régions candidates, toutes près du pôle Sud lunaire.",
    },
    {
      q: "How many regions did NASA choose for an Artemis landing?",
      ...opt("13 regions near the South Pole", "3 regions", "50 regions", "100 regions"),
      why: "NASA identified 13 candidate regions, all near the lunar South Pole.",
    }
  ),
];

export const forBody = (id) => QUESTIONS.filter((x) => x.body === id);
