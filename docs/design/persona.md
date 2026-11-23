# Persona Bible: Major Malcolm Wheeler-Nicholson

The single reference for who Wheeler-Nicholson is, how he speaks and what he talks about. Anyone writing dialogue uses this so the character sounds consistent across every topic file.

**Requirements covered:** 1.1, 1.7, 1.9, 2.2

---

## 1. Who he is (one paragraph)

Malcolm Wheeler-Nicholson (1890–1965) was a US Cavalry officer turned pulp-adventure writer who founded **National Allied Publications** in 1934–35, the company that grew into DC Comics. His *New Fun* (cover-dated February 1935) is generally credited as the first American comic book made entirely of original material rather than newspaper-strip reprints. He gave Jerry Siegel and Joe Shuster, later the creators of Superman, their first published comic work, and launched *Detective Comics*. Deep in debt to his printer and distributor Harry Donenfeld, he was forced out in 1938, months before *Action Comics #1* introduced Superman, and never shared in the industry's success.

---

## 2. Setting of the conversation

- **When:** 1964, New York. He is 74, a year before his death.
- **Why this date:** he knows how the story ended: Superman and Batman are household names, and DC is a major company without him. That gives him both pride and bitterness to draw on.
- **Framing:** the user is a visitor interviewing him about his life. He is courteous, a little formal, and wary of being written off as a failure.
- **He does not know** anything after 1964. If asked about modern things (films, the internet, the DC Universe), he responds in character with confusion or deflection.

---

## 3. Timeline (verified facts for dialogue)

| Year | Event | Notes for writers |
|---|---|---|
| 1890 | Born Malcolm Strain, 7 January, Greeneville, Tennessee | Father died when he was young |
| 1890s–1900s | Mother, Antoinette, a journalist, remarried; the family took the name Wheeler-Nicholson. Grew up partly in Portland, Oregon, and on a horse ranch in Washington state, where he learned to ride | Family hosted guests including Theodore Roosevelt and Rudyard Kipling. He is proud of this |
| 1900s | Attended the Manlius School, New York (a military school) | |
| 1910s | Commissioned in the US Cavalry. Sources give different start dates, so avoid stating an exact year | |
| 1910s | By his own account: chased bandits on the Mexican border, served in the Philippines (polo and fevers), led a battalion against the Bolsheviks in Siberia, and served in France and the Rhineland | These are **his claims**, so write them as his memories, not as narrator facts |
| c.1917 | Became a major, said to be one of the youngest in the Cavalry | Sources disagree on "youngest in the Army" vs "one of the youngest in the Cavalry". He would claim the bigger version |
| After WWI | Studied at Saint-Cyr and the École Supérieure de Guerre in France | |
| 1920 | Married Elsa Sachsenhausen Björkbom in Koblenz, Germany; they had five children | Keep family details light and respectful |
| 1922 | Published *Modern Cavalry* (Macmillan) | |
| 1922 | Wrote an open letter to President Harding criticising Army leadership. Was shot and wounded (the Army said a guard mistook him for an intruder; his family believed it was deliberate). Court-martialled and convicted for the letter | The shooting's cause is **disputed**. He can suspect, but the app shouldn't state it as fact |
| 1923 | Resigned his commission | |
| 1920s–30s | Wrote military and historical adventure stories for pulp magazines such as *Adventure* and *Argosy* | Pride: his stories drew on real experience |
| 1925 | Founded Wheeler-Nicholson, Inc. to syndicate his work, including a *Treasure Island* comic strip | |
| 1934–35 | Founded National Allied Publications. Rights to popular newspaper strips were already taken, so he commissioned original material | His key idea. He's very proud of it |
| Feb 1935 | *New Fun #1*, large-format, original strips; also the first comic to carry advertising | |
| Oct 1935 | *New Fun #6*: Siegel and Shuster's comic-book debut ("Henri Duval", "Doctor Occult") | He "discovered" them |
| Dec 1935 | *New Comics* launched (later *Adventure Comics*) | |
| 1935–37 | Constant cash-flow problems: high returns, sceptical newsstands, unpaid creators | He is defensive about slow payments to artists |
| 1937 | *Detective Comics #1* (March cover date). To fund it, he took on Donenfeld and his accountant Jack Liebowitz as partners in Detective Comics, Inc. | |
| 1938 | Sent on a cruise to Cuba by Donenfeld; returned to find himself locked out. Sued for non-payment, forced into bankruptcy; assets sold to Donenfeld's company | Emotional core of the character |
| June 1938 | *Action Comics #1*: Superman debuts, without him | |
| May 1939 | Batman debuts in *Detective Comics #27* | |
| 1940s | Returned to writing on military affairs: *Battle Shield of the Republic* (1940), *America Can Win* (1941) | |
| 1965 | Died 21 September, New York City (outside the conversation's timeframe) | |
| 2008 | Inducted into the Will Eisner Comic Book Hall of Fame (posthumous; do not mention in dialogue) | Useful for the ending summary or "about" page |

---

## 4. Personality

| Trait | How it shows in dialogue |
|---|---|
| **Proud** | Talks up his military record and his "first" in comics. Bristles if called a failure. |
| **Principled to a fault** | Defends the open letter: he told the truth and paid for it. Sees the comics loss the same way. |
| **Storyteller** | Answers in short anecdotes rather than dry facts; a pulp writer's sense of drama. |
| **Courteous but formal** | Calls the user "friend" or "young man / young lady" (pick one per session, or just "friend" to avoid assuming gender). Never swears. |
| **Bitter under the surface** | Polite about Donenfeld in public mode; cutting once rapport is high. |
| **Not self-pitying** | Even bitter lines end with dignity or dry humour. |

---

## 5. Voice rules for writers

1. **Era-appropriate language.** 1930s–60s American English: "newsstand", "the funnies", "outfit" (for a company), "a fellow", "I dare say". No modern slang or idioms ("awesome", "content", "brand").
2. **Short paragraphs.** Each line is 1–3 sentences, rarely more than 50 words. It's a chat, not a lecture.
3. **Military metaphors.** Business is a campaign; debt is a siege; Donenfeld is the enemy who took the fort.
4. **Facts in first person.** "I sent the boys' pages to the printer myself," not "Wheeler-Nicholson published Siegel and Shuster."
5. **Hedge disputed facts.** Use "some say", "the Army claimed", "I'll let you decide".
6. **Mood matches the text.** Every node's `mood` field must fit what he's saying (see schema).
7. **No invented quotes presented as real.** All dialogue is our original writing in his voice. The app's about page should state this.

---

## 6. Topics

| Topic (`TopicId`) | What he covers | Emotional tone | Gated? |
|---|---|---|---|
| `intro` | Greeting, who he is, what the user wants to know | Courteous, curious | No |
| `military` | Cavalry life, the border, Siberia, the open letter, the court-martial | Proud, then defiant | The shooting needs rapport ≥ 60 |
| `pulps` | Writing for *Adventure* and *Argosy*, why real experience mattered | Warm, amused | No |
| `founding` | The idea for original comics, *New Fun*, finding Siegel and Shuster | Proud, energetic | No |
| `downfall` | Debts, Donenfeld and Liebowitz, the cruise, the locked office | Guarded → bitter | The lockout needs rapport ≥ 60 |
| `legacy` | Superman, Batman, what DC became, regrets, what he'd tell young founders | Bittersweet | Unlocked after `downfall` |

---

## 7. Characters he talks about

**No total count of DC characters.** There are thousands, no reliable figure exists, and he wouldn't know it in 1964. What matters is which characters he would realistically discuss and how he feels about each. Characters act as **entry points**: when a user types a character's name, the intent matcher routes them into the right topic (see `schema.md`, section 9).

### 7.1 Tier 1: published under him (first-hand, proud, detailed)

| Character | First appearance | What he'd say | Routes to |
|---|---|---|---|
| **Henri Duval** | *New Fun #6* (Oct 1935), Siegel & Shuster's comic-book debut | A swashbuckler. Proof he spotted the Cleveland boys' talent first | `founding` |
| **Doctor Occult** | *New Fun #6* (Oct 1935), Siegel & Shuster, credited as "Leger and Reuths" | A supernatural detective; often called the oldest character DC still uses. He's quietly pleased about that | `founding` |
| **Slam Bradley** | *Detective Comics #1* (Mar 1937) | A tough private eye. Generally credited as **his concept**, developed by Siegel & Shuster. His proudest creative claim | `founding` / `downfall` |

### 7.2 Tier 2: arrived just after he was forced out (bittersweet, the emotional core)

| Character | First appearance | What he'd say | Routes to | Gated? |
|---|---|---|---|---|
| **Superman** | *Action Comics #1* (June 1938) | Siegel & Shuster had been pitching it for years. Months after he lost the company, it became the biggest thing in comics | `legacy` | Full answer needs rapport ≥ 60; low rapport gets a curt deflection |
| **Batman** | *Detective Comics #27* (May 1939) | Appeared in *his* magazine title, a year after he'd lost it | `legacy` | No |

### 7.3 Tier 3: later DC heroes he's only heard of (vague, distant)

| Character | First appearance | What he'd say | Routes to |
|---|---|---|---|
| **Wonder Woman** | *All Star Comics #8* (cover date Dec 1941–Jan 1942) | Knows the name; didn't follow it | `legacy` |
| **The Flash** (new version) / **Justice League** | *Showcase #4* (1956) / *The Brave and the Bold #28* (1960) | "My grandchildren tell me there's a whole league of them now." | `legacy` |

### 7.4 Tier 4: after 1964 (out of his knowledge)

Any later character, film or TV show gets an in-character anachronism line (sample line 26), and the user stays on the current node.

### 7.5 Rules for writers

1. **Names in dialogue only.** No DC artwork, logos or character images anywhere in the UI.
2. **Don't overclaim.** He created none of the Tier 2–3 characters. He can say he "gave the boys their start", not that Superman was his idea.
3. **Credit fairly.** Slam Bradley is described as his concept *developed by* Siegel & Shuster, not his alone.
4. **Tier 1 is where he's most detailed.** The deepest character dialogue should be about the work he actually published.

---

## 8. Sample lines (tone reference)

Original writing in his voice, not historical quotes.

**Greeting / intro**
1. "Come in, come in. Not many people knock on this door asking about the old days anymore. Sit down. What would you like to know?"
2. "Major Malcolm Wheeler-Nicholson, formerly of the United States Cavalry. These days, mostly a writer, and a man with a long memory."
3. "Ask what you like. I have answered harder questions in front of a court-martial."

**Military**
4. "I learned to ride before I learned my algebra. A horse ranch in Washington state will do that to a boy."
5. "The Mexican border, the Philippines, Siberia in winter. I have been cold, sick and shot at, and I would not trade a day of it."
6. "I told the President the Army was being run by men more interested in their careers than their soldiers. I was right, and they made sure I paid for it."
7. *(rapport ≥ 60)* "Not long after that letter, I took a bullet at a fellow officer's house. A guard's mistake, they said. I will leave it to you what to believe."
8. "They convicted me for writing a letter. Not for cowardice, not for theft. For a letter."

**Pulps**
9. "The pulp editors wanted adventure, and I had lived some. Most fellows writing about cavalry charges had never sat on a horse."
10. "A penny or two a word. You learn to make every word earn its keep."

**Founding**
11. "Every newspaper strip worth reprinting was already spoken for. So I thought, why not make our own? New stories, new characters, made for the magazine."
12. "*New Fun*. February 1935. Big as a newspaper page and every strip in it brand new. Nobody had done that before, whatever anyone tells you."
13. "Two boys from Cleveland sent me pages. Rough, but full of energy. Siegel and Shuster. I bought their work when nobody else would."
14. "Newsstand dealers looked at our books like I'd handed them a dead fish. An unknown publisher, unknown characters. Returns piled up like snowdrifts."

**Downfall**
15. "Paying artists late was not a policy, friend, it was a symptom. Money came in slower than it went out. Every publisher in a Depression knows that arithmetic."
16. "Donenfeld printed my books, and I owed him for it. When a man holds your debts, he holds your future."
17. "I needed money for *Detective Comics*. He offered it, at the price of a partnership. I signed. A man with creditors at the door does not haggle long."
18. *(rapport ≥ 60)* "He paid for a cruise. Go to Cuba, rest, come back with new ideas, he said. I came home to a locked office and a stack of lawyers' papers."
19. *(low rapport)* "I don't care to discuss Mr. Donenfeld with strangers."

**Legacy**
20. "Superman came out in the summer of '38. Those same two boys. A few months earlier and he would have been mine."
21. "I see the children with their comic books on the subway and I think: I built the road they're travelling on. Others collected the tolls."
22. "Regrets? I trusted the wrong partner. In the Army, at least, you know which side the enemy is on."
23. "If you ever start a company, keep your own books and owe no man more than you can repay by Friday."

**Characters**
30. "Doctor Occult. A ghost-hunting detective, drawn by two boys from Cleveland who signed themselves Leger and Reuths. They were a bit shy of their own names back then."
31. "Slam Bradley was my notion: a two-fisted private eye for *Detective Comics*. The boys gave him his punch. I gave him his beat."
32. *(rapport ≥ 60)* "Superman. Those boys had been carrying that idea around for years. I had their pages on my desk for other features. A few months more, and the strongest man in the world would have been working for me."
33. *(low rapport)* "I'd rather not talk about Superman. Ask me something else."
34. "Batman turned up in *Detective Comics*. My title. I didn't hear about him until he was already famous."
35. "Wonder Woman? I know the name. I'm afraid I stopped following the new ones after I left the business."
36. "My grandchildren tell me there's a whole league of them now. Back in my day, one hero per magazine was plenty."

**Fallback / confusion (typed questions)**
24. "I'm not sure I follow you, friend. Ask me about the Army, the pulps, or the comics business."
25. "That's a new one on me. In my day we kept our questions plainer."
26. *(anachronism)* "I'm afraid I don't know what that is. I'm an old soldier in 1964, not a fortune teller."

**Endings**
27. *Reconciled:* "You've let an old man tell his story properly. Not many have. Perhaps I did start something after all. Good day, friend."
28. *Unfinished business:* "Well, that's enough for one afternoon. Come back sometime, and there's more I could tell you."
29. *Door closed:* "I think we're finished here. Good afternoon."

---

## 9. Sensitive areas and how to handle them

| Area | Approach |
|---|---|
| **The shooting** | Present both accounts (accident vs deliberate). Never state it as an assassination attempt. |
| **Late payments to creators** | Historians record that creators were often paid late. Let him be defensive, but don't make the app excuse it. |
| **Donenfeld and Liebowitz** | They are real people. Show his bitterness as *his* view; don't present criminal accusations as fact. |
| **Family** | Wife and children only in passing; no invented private details. |
| **Copyright** | Mention Superman, Batman and DC by name in dialogue only. Use **no** DC artwork or logos in the UI; use original illustrations instead. |

---

## 10. Facts to double-check before using

- Slam Bradley's creator credit: some sources credit Siegel & Shuster alone; others credit Wheeler-Nicholson's concept.
- Exact year he joined the Cavalry (sources differ).
- "Youngest major" claim (Army vs Cavalry).
- Exact month of the 1922 court-martial (June in most accounts; one source gives February for a related report).
- Whether *New Fun* ran five or six issues under that title before becoming *More Fun* (sources differ).

---

## 11. Sources (APA 7th)

Check at least the books below in the BU library. Use Wikipedia only to find sources, never as a citation.

Daniels, L. (1995). *DC Comics: Sixty years of the world's favorite comic book heroes*. Bulfinch Press.

Goulart, R. (1986). *Ron Goulart's great history of comic books*. Contemporary Books.

Hajdu, D. (2008). *The ten-cent plague: The great comic-book scare and how it changed America*. Farrar, Straus and Giroux.

Jones, G. (2004). *Men of tomorrow: Geeks, gangsters, and the birth of the comic book*. Basic Books.

Wheeler-Nicholson, M. (1922). *Modern cavalry: Studies on its role in the warfare of today, with notes on training for war service*. Macmillan.

Wheeler-Nicholson, N. (2018). *DC Comics before Superman: Major Malcolm Wheeler-Nicholson's pulp comics*. Hermes Press.

Wheeler-Nicholson, N. (2020). *New Fun #1: Its place in history*. The Major and His Legacy. https://themajorandhislegacy.com/?p=1675

Ricca, B. (2013). *Super boys: The amazing adventures of Jerry Siegel and Joe Shuster, the creators of Superman*. St. Martin's Press.

Wheeler-Nicholson, N. (n.d.). *Slam Bradley: DC Comics' detective hero*. The Major and His Legacy. https://themajorandhislegacy.com/slam-bradley-dc-comics-detective-hero/

Encyclopaedia Britannica. (n.d.). *New Fun*. In *Britannica*. Retrieved November 20, 2026, from https://www.britannica.com/topic/New-Fun
