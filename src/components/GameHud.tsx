import { useMemo } from "react";
import { adjustRestockAmount, applyUpgrade, commitRestock, setPanel, setRestockCounter, toggleMusic, toggleSounds } from "../game/engine";
import { useGameStore } from "../game/store";
import { playClick, stopBackgroundMusic } from "../audio/sounds";

const getCost = (items: Record<string, { cost: number }>, key: string) => items[key]?.cost ?? 0;

function PanelButtons() {
  const patch = useGameStore((state) => state.patch);
  const soundsOn = useGameStore((state) => state.soundOn);
  const panel = useGameStore((state) => state.panel);
  const togglePanel = (target: "restock" | "orders" | "upgrades") => patch((state) => setPanel(state, state.panel === target ? "none" : target));

  return (
    <div className="panel-buttons">
      <button
        className={panel === "restock" ? "active" : ""}
        onMouseEnter={() => playClick(soundsOn)}
        onClick={() => togglePanel("restock")}
      >
        <img src="/assets/restockBtn.png" alt="Restock" />
      </button>
      <button className={panel === "orders" ? "active" : ""} onMouseEnter={() => playClick(soundsOn)} onClick={() => togglePanel("orders")}>
        <img src="/assets/ordersBtn.png" alt="Orders" />
      </button>
      <button className={panel === "upgrades" ? "active" : ""} onMouseEnter={() => playClick(soundsOn)} onClick={() => togglePanel("upgrades")}>
        <img src="/assets/upgradesBtn.png" alt="Upgrades" />
      </button>
    </div>
  );
}

function RestockPanel() {
  const patch = useGameStore((state) => state.patch);
  const counters = useGameStore((state) => state.counters);
  const items = useGameStore((state) => state.items);
  const money = useGameStore((state) => state.player.money);
  const soundsOn = useGameStore((state) => state.soundOn);
  const selectedId = useGameStore((state) => state.ui.restockCounterId);
  const amount = useGameStore((state) => state.ui.restockAmount);
  const safeAdjust = (delta: number) => patch((state) => adjustRestockAmount(state, delta));

  const sortedCounters = useMemo(() => [...counters].sort((a, b) => a.itemKey.localeCompare(b.itemKey)), [counters]);
  const selected = counters.find((counter) => counter.id === selectedId) ?? sortedCounters[0];
  if (!selected) return null;
  const cost = items[selected.itemKey].cost * amount;
  const canAfford = money >= cost && amount > 0;

  return (
    <div className="panel-content restock-panel">
      <img src="/assets/restockBackground.png" alt="" className="panel-bg" />
      <select value={selected.id} onChange={(event) => patch((state) => setRestockCounter(state, event.target.value))} onMouseEnter={() => playClick(soundsOn)}>
        {sortedCounters.map((counter) => (
          <option key={counter.id} value={counter.id}>
            {counter.itemKey} counter
          </option>
        ))}
      </select>
      <img src={items[selected.itemKey].image} className="restock-item" alt={selected.itemKey} />
      <button
        className="icon-btn p1"
        onMouseEnter={() => playClick(soundsOn)}
        onPointerDown={(event) => {
          event.preventDefault();
          safeAdjust(1);
        }}
      >
        <img src="/assets/plus1.png" alt="+1" />
      </button>
      <button
        className="icon-btn m1"
        onMouseEnter={() => playClick(soundsOn)}
        onPointerDown={(event) => {
          event.preventDefault();
          safeAdjust(-1);
        }}
      >
        <img src="/assets/minus1.png" alt="-1" />
      </button>
      <button
        className="icon-btn p10"
        onMouseEnter={() => playClick(soundsOn)}
        onPointerDown={(event) => {
          event.preventDefault();
          safeAdjust(10);
        }}
      >
        <img src="/assets/plus10.png" alt="+10" />
      </button>
      <button
        className="icon-btn m10"
        onMouseEnter={() => playClick(soundsOn)}
        onPointerDown={(event) => {
          event.preventDefault();
          safeAdjust(-10);
        }}
      >
        <img src="/assets/minus10.png" alt="-10" />
      </button>
      <button className="restock-action" onMouseEnter={() => playClick(soundsOn)} onClick={() => patch((state) => commitRestock(state))}>
        <img src={canAfford ? "/assets/restockActionBtn.png" : "/assets/restockActionBtnGrey.png"} alt="Restock action" />
      </button>
      <div className="restock-text">
        <p>Buying: {amount}</p>
        <p>Remaining: {selected.stock}</p>
        <p>Cost: {cost}</p>
        <p>{money < cost ? "Insufficient money" : `Money after purchase: ${money - cost}`}</p>
      </div>
    </div>
  );
}

function OrdersPanel() {
  const allCustomers = useGameStore((state) => state.customers);
  const items = useGameStore((state) => state.items);
  const tips = useGameStore((state) => state.player.tips);
  const customers = useMemo(() => allCustomers.filter((customer) => customer.seated), [allCustomers]);
  const incomingCount = allCustomers.filter((customer) => !customer.seated).length;

  return (
    <div className="panel-content orders-panel">
      <div className="orders-header">Current Orders</div>
      {customers.length === 0 && <p className="empty-orders">{incomingCount > 0 ? `Waiting for ${incomingCount} customer(s) to sit...` : "No seated customers yet."}</p>}
      {customers.map((customer) => {
        const safeOrder = Array.isArray(customer.order) ? customer.order : [];
        const cost = 1 + safeOrder.reduce((sum, key) => sum + getCost(items, key), 0);
        return (
          <article key={customer.id} className="order-card">
            <img src="/assets/orderDisplayBox.png" alt="" />
            <div className="order-copy">
              <strong className="order-num">#{customer.seatNumber}</strong>
              <span className="order-value order-value-ingredients">{safeOrder.join(", ")}</span>
              <span className="order-value order-value-cost">${cost}</span>
              <span className="order-value order-value-earned">${Math.trunc(cost * 1.5) + tips}</span>
            </div>
            <div className="order-icons">
              {safeOrder.slice(0, 4).map((key, index) => (
                <img key={`${customer.id}-${key}-${index}`} src={items[key]?.image} alt={key} />
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function UpgradesPanel() {
  const patch = useGameStore((state) => state.patch);
  const upgrades = useGameStore((state) => state.upgrades);
  const money = useGameStore((state) => state.player.money);
  const soundsOn = useGameStore((state) => state.soundOn);

  const iconFor = (level: number, max: number, cost: number) => {
    if (level >= max) return "/assets/max.png";
    if (money < cost) return "/assets/insufficient.png";
    return "/assets/upgrade.png";
  };

  return (
    <div className="upgrades-panel">
      <img src="/assets/upgradesBackground.png" alt="" className="panel-bg" />
      <button className="upgrade-btn ad" onMouseEnter={() => playClick(soundsOn)} onClick={() => patch((state) => applyUpgrade(state, "advertisement"))}>
        <img src={iconFor(upgrades.advertisementLevel, upgrades.maxLevel, upgrades.advertisementCost)} alt="Advertisement upgrade" />
      </button>
      <div className="upgrade-meta ad">
        <p>Level {upgrades.advertisementLevel}/{upgrades.maxLevel}</p>
        <p>{upgrades.advertisementLevel >= upgrades.maxLevel ? "MAX LEVEL" : `Cost: ${upgrades.advertisementCost}`}</p>
      </div>
      <button className="upgrade-btn energy" onMouseEnter={() => playClick(soundsOn)} onClick={() => patch((state) => applyUpgrade(state, "energy"))}>
        <img src={iconFor(upgrades.energyLevel, upgrades.maxLevel, upgrades.energyCost)} alt="Energy upgrade" />
      </button>
      <div className="upgrade-meta energy">
        <p>Level {upgrades.energyLevel}/{upgrades.maxLevel}</p>
        <p>{upgrades.energyLevel >= upgrades.maxLevel ? "MAX LEVEL" : `Cost: ${upgrades.energyCost}`}</p>
      </div>
      <button className="upgrade-btn cute" onMouseEnter={() => playClick(soundsOn)} onClick={() => patch((state) => applyUpgrade(state, "cuteness"))}>
        <img src={iconFor(upgrades.cutenessLevel, upgrades.maxLevel, upgrades.cutenessCost)} alt="Cuteness upgrade" />
      </button>
      <div className="upgrade-meta cute">
        <p>Level {upgrades.cutenessLevel}/{upgrades.maxLevel}</p>
        <p>{upgrades.cutenessLevel >= upgrades.maxLevel ? "MAX LEVEL" : `Cost: ${upgrades.cutenessCost}`}</p>
      </div>
      <button className="upgrade-btn max" onMouseEnter={() => playClick(soundsOn)} onClick={() => patch((state) => applyUpgrade(state, "meowmax"))}>
        <img src={iconFor(upgrades.meowmaxLevel, 2, upgrades.meowmaxCost)} alt="Meowmax upgrade" />
      </button>
      <div className="upgrade-meta max">
        <p>Level {upgrades.meowmaxLevel}/2</p>
        <p>{upgrades.meowmaxLevel >= 2 ? "MAX LEVEL" : `Cost: ${upgrades.meowmaxCost}`}</p>
      </div>
    </div>
  );
}

export function GameHud() {
  const panel = useGameStore((state) => state.panel);
  const setScreen = useGameStore((state) => state.setScreen);
  const patch = useGameStore((state) => state.patch);
  const soundOn = useGameStore((state) => state.soundOn);
  const musicOn = useGameStore((state) => state.musicOn);
  const soundsOn = soundOn;

  return (
    <section className="hud">
      <button
        className="back-button in-game"
        onMouseEnter={() => playClick(soundsOn)}
        onClick={() => {
          patch((state) => setPanel(state, "none"));
          stopBackgroundMusic();
          setScreen("menu");
        }}
      >
        <img src="/assets/backBtn.png" alt="Back" />
      </button>
      <PanelButtons />
      <div className="sound-buttons">
        <button onMouseEnter={() => playClick(soundsOn)} onClick={() => patch((state) => toggleSounds(state))}>
          <img src={soundOn ? "/assets/soundOn.png" : "/assets/soundOff.png"} alt="Sound" />
        </button>
        <button onMouseEnter={() => playClick(soundsOn)} onClick={() => patch((state) => toggleMusic(state))}>
          <img src={musicOn ? "/assets/musicOn.png" : "/assets/musicOff.png"} alt="Music" />
        </button>
      </div>
      {panel === "restock" && <RestockPanel />}
      {panel === "orders" && <OrdersPanel />}
      {panel === "upgrades" && <UpgradesPanel />}
    </section>
  );
}
