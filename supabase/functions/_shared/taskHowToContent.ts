/**
 * Step-by-step how-tos for library tasks. Dependency-free so both the app
 * (src/data/taskHowTos.ts) and edge functions import this one copy.
 */

export interface TaskHowTo {
  steps: string[];
  tools?: string[];
  safety?: string;
}

/** Keyed by the library task title exactly as written in maintenancePlans. */
export const TASK_HOW_TOS: Record<string, TaskHowTo> = {
  "Replace HVAC filter": {
    tools: ["Replacement filter (same size and MERV rating)", "Marker"],
    steps: [
      "Turn the thermostat to off so the blower isn't pulling air while the slot is open.",
      "Find the filter slot at the furnace or air handler, or behind the main return grille.",
      "Slide out the old filter and note the size printed on its frame.",
      "Insert the new filter with the airflow arrow pointing toward the furnace (away from the return).",
      "Write today's date on the frame, close the slot, and turn the system back on.",
    ],
  },
  "Test smoke & CO alarms": {
    tools: ["Step stool", "Spare batteries if not sealed-battery units"],
    steps: [
      "Let everyone in the house know you're testing so the noise isn't alarming.",
      "Press and hold the test button on each alarm until it sounds; interconnected alarms should all go off together.",
      "Replace batteries in any unit that chirps or sounds weak.",
      "Check the manufacture date on the back. Replace smoke alarms older than 10 years and CO alarms older than 7–10 years (per the label).",
      "Vacuum dust from the vents with a soft brush attachment.",
    ],
    safety:
      "If a CO alarm ever goes off outside a test, get everyone outside and call emergency services.",
  },
  "Exercise GFCI outlets": {
    tools: ["Small lamp or plug-in outlet tester"],
    steps: [
      "Plug a lamp or tester into the GFCI outlet and turn it on.",
      "Press TEST. The power should cut and the RESET button should pop out.",
      "Press RESET firmly to restore power.",
      "Check outlets downstream on the same circuit (often bathroom, kitchen, garage, outdoor); they should lose power during the test too.",
      "If an outlet doesn't trip or won't reset, stop using it and have an electrician replace it.",
    ],
  },
  "Clean gutters & downspouts": {
    tools: ["Sturdy ladder with stabilizer", "Gloves", "Gutter scoop or trowel", "Bucket or tarp", "Garden hose"],
    steps: [
      "Set the ladder on firm, level ground and extend it 3 ft above the gutter edge.",
      "Start near a downspout and scoop debris into a bucket or onto a tarp below.",
      "Work along the full run, moving the ladder rather than overreaching.",
      "Flush the gutter with a hose toward the downspout and confirm water flows freely out the bottom.",
      "Clear a clogged downspout by running the hose up from the bottom or tapping the elbow.",
      "Check that downspouts discharge at least 4–6 ft from the foundation.",
    ],
    safety:
      "Keep three points of contact on the ladder and stay well clear of power lines. Hire out two-story or steep roofs.",
  },
  "Clean dryer vent duct": {
    tools: ["Dryer vent brush kit (drill-driven rods)", "Vacuum", "Screwdriver", "Foil tape"],
    steps: [
      "Unplug the dryer (and shut off the gas valve if it's a gas dryer).",
      "Pull the dryer out and disconnect the duct from the back.",
      "Vacuum lint from the dryer outlet and the lint-trap cavity.",
      "Run the brush rods through the duct from inside toward the outside hood, in short sections.",
      "Go outside and clear lint from the exterior hood; make sure the flap opens freely.",
      "Reconnect the duct with foil tape (not screws), push the dryer back without kinking it, and run a short cycle to confirm strong airflow outside.",
    ],
    safety: "Replace any plastic or foil accordion duct with rigid or semi-rigid metal.",
  },
  "Flush water heater": {
    tools: ["Garden hose", "Bucket", "Flathead screwdriver", "Gloves"],
    steps: [
      "Turn the heater to pilot or vacation (gas), or switch off the breaker (electric).",
      "Close the cold-water supply valve at the top of the tank.",
      "Attach a hose to the drain valve at the bottom and run it to a floor drain or outside.",
      "Open a hot-water faucet in the house to let air in, then open the drain valve.",
      "Drain until the water runs clear. Briefly open the cold supply to stir up and flush remaining sediment.",
      "Close the drain valve, remove the hose, and open the cold supply to refill. Wait until the open faucet runs steadily with no air.",
      "Restore gas or power only after the tank is full.",
    ],
    safety:
      "The water can be scalding. Let it cool for an hour or two first. Never power an electric heater with an empty tank.",
  },
  "Test sump pump": {
    tools: ["Bucket of water"],
    steps: [
      "Make sure the pump is plugged in (and any backup battery is charged).",
      "Slowly pour water into the sump pit until the float rises.",
      "The pump should start, empty the pit, and shut off on its own.",
      "Go outside and confirm water is discharging away from the house.",
      "Clear debris from the pit and check the discharge line isn't frozen or blocked.",
    ],
  },
  "Check fire extinguisher(s)": {
    steps: [
      "Check the pressure gauge: the needle should be in the green zone.",
      "Make sure the pin and tamper seal are intact and the nozzle is clear.",
      "Look for dents, rust, or a damaged hose.",
      "For dry-chemical units, turn the extinguisher upside down and shake it a few times so the powder doesn't pack.",
      "Confirm it's mounted near an exit and that everyone knows where it is. Replace or service any unit that fails a check.",
    ],
  },
  "Inspect washing machine hoses": {
    tools: ["Flashlight"],
    steps: [
      "Pull the washer out enough to see the hot and cold supply hoses.",
      "Look for bulges, cracks, kinks, or rust at the fittings.",
      "Feel the connections for dampness and check the floor for stains.",
      "Replace rubber hoses older than 5 years with braided stainless steel hoses.",
      "Know where the supply valves are so you can shut them off quickly.",
    ],
  },
  "Clean dishwasher filter": {
    tools: ["Soft brush or old toothbrush", "Dish soap"],
    steps: [
      "Pull out the bottom rack.",
      "Twist and lift out the cylindrical filter, then remove the flat mesh filter underneath.",
      "Rinse both under warm water and scrub gently with soapy water.",
      "Wipe out any debris in the filter well.",
      "Reinstall the filters, locking the cylinder back in place.",
    ],
  },
  "Clean kitchen vent hood grease filters": {
    tools: ["Baking soda", "Degreasing dish soap", "Non-abrasive brush"],
    steps: [
      "Turn off the hood and let the filters cool.",
      "Pop out the metal mesh or baffle filters.",
      "Soak them in very hot water with dish soap and a few tablespoons of baking soda for 15 minutes.",
      "Scrub gently, rinse, and let them dry completely.",
      "Reinstall. Charcoal (recirculating) filters can't be washed and need replacing instead.",
    ],
  },
  "Replace refrigerator water filter": {
    tools: ["Replacement filter (matching model number)", "Towel"],
    steps: [
      "Find the filter (inside the fridge at the top-right, in the base grille, or behind the crisper).",
      "Twist or push to release the old filter. Keep a towel handy for drips.",
      "Remove the protective cap from the new filter and install it the same way.",
      "Run 2–3 gallons through the dispenser to flush air and carbon fines.",
      "Reset the filter indicator light if your fridge has one.",
    ],
  },
  "Lubricate & test garage door": {
    tools: ["Garage door lubricant spray (silicone or lithium)", "Rag", "Roll of paper towels"],
    steps: [
      "Close the door and unplug the opener.",
      "Spray hinges, roller bearings, and the torsion spring lightly; wipe off excess.",
      "Do not lubricate the tracks themselves; wipe them clean instead.",
      "Plug the opener back in. Place a roll of paper towels under the door and close it. It should reverse when it touches the roll.",
      "Wave an object through the photo-eye beam while the door is closing. It should reverse.",
    ],
    safety:
      "Never adjust torsion springs or cables yourself. They're under high tension. Call a pro.",
  },
  "Clean mini-split indoor filters": {
    tools: ["Soft brush or vacuum with brush attachment"],
    steps: [
      "Turn the unit off at the remote (and ideally the breaker).",
      "Lift the front panel until it clicks open.",
      "Slide out the mesh filters.",
      "Vacuum or rinse them with lukewarm water. Don't use hot water or harsh cleaners.",
      "Let them dry fully, slide them back in, and close the panel.",
    ],
  },
  "Clean heat pump filters": {
    tools: ["Replacement filter or soft brush"],
    steps: [
      "Switch the system off at the thermostat.",
      "Open the filter slot at the indoor air handler or return grille.",
      "Replace disposable filters, or vacuum and rinse washable ones and let them dry.",
      "Reinstall with the airflow arrow pointing toward the air handler.",
      "While you're there, clear leaves and debris at least 2 ft around the outdoor unit.",
    ],
  },
  "Winterize outdoor faucets": {
    tools: ["Insulated faucet covers"],
    steps: [
      "Disconnect and drain all garden hoses.",
      "Close the indoor shutoff valve for each outdoor faucet, if you have one.",
      "Open the outdoor faucet to let trapped water drain, then leave it open if the line has a shutoff.",
      "Fit an insulated cover over each faucet.",
      "Frost-free sillcocks don't need an indoor shutoff, but they still need the hose removed.",
    ],
  },
  "Refill water softener salt": {
    tools: ["Softener salt (pellets or crystals)"],
    steps: [
      "Lift the brine tank lid and check the salt level. Refill when it's below half.",
      "Break up any crust or salt bridge with a broom handle.",
      "Pour in salt until the tank is about half to two-thirds full.",
      "Keep the salt level a few inches above the water line.",
    ],
  },
  "Check water heater drain pan": {
    tools: ["Flashlight", "Towel"],
    steps: [
      "Look in the pan under the tank for water, rust flakes, or mineral deposits.",
      "Check the drain line from the pan for clogs.",
      "Check the temperature and pressure relief valve's discharge pipe for drips.",
      "Any standing water usually means a leak. Have it looked at before it gets worse.",
    ],
  },
  "Empty & clean dehumidifier": {
    tools: ["Mild soap", "Soft brush"],
    steps: [
      "Unplug the unit.",
      "Empty the bucket, wash it with mild soap, and let it dry.",
      "Remove and rinse the air filter, letting it dry before reinstalling.",
      "If it drains by hose, check that the hose isn't kinked or clogged.",
    ],
  },
  "Clear window wells": {
    tools: ["Gloves", "Trowel or shop vac"],
    steps: [
      "Remove leaves, trash, and debris from each window well.",
      "Check that the drain at the bottom (if any) is clear.",
      "Inspect the well cover for cracks and confirm it still opens easily as an exit.",
    ],
  },
};

/** Same normalization as normalizeRoutineTitle in src/data/maintenancePlans/types.ts. */
function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

let normalizedIndex: Map<string, TaskHowTo> | null = null;

export function findTaskHowTo(title: string): TaskHowTo | null {
  if (!normalizedIndex) {
    normalizedIndex = new Map(
      Object.entries(TASK_HOW_TOS).map(([key, howTo]) => [
        normalizeTitle(key),
        howTo,
      ])
    );
  }
  return normalizedIndex.get(normalizeTitle(title)) ?? null;
}
