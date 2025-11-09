

"""
learning.py
-------------
Simulates a simple Markov Decision Process (MDP) for multiple meals in a day
for the UMass Dining calorie counter. The goal is to choose menu items at each meal
that keep the user close to their daily calorie target.

Author: Sardar Rahman
"""

import numpy as np
import random

# --- Define the environment ---

# Total daily calorie goal
DAILY_CALORIE_TARGET = 2000

# Define meals in order
MEALS = ["breakfast", "lunch", "dinner"]

# Define menu items (name: calories)
MENU = {
    "omelette": 400,
    "bagel": 300,
    "smoothie": 250,
    "salad": 350,
    "sandwich": 600,
    "burger": 900,
    "pizza": 800,
    "pasta": 700,
    "fruit_bowl": 200,
    "ice_cream": 400
}

# States: remaining calories after each meal (discretized)
STATES = list(range(0, DAILY_CALORIE_TARGET + 100, 100))

# Discount factor
GAMMA = 0.9


def reward(remaining, item_calories):
    """
    Reward function:
    - Positive reward for hitting target closely.
    - Negative penalty for overshoot or being far below goal.
    """
    new_remaining = remaining - item_calories
    if new_remaining < 0:
        return -abs(new_remaining) * 0.1  # overshoot penalty
    elif new_remaining <= 100:
        return 10  # ideal
    else:
        return -0.05 * new_remaining  # small penalty for under target


def transition(remaining, item_calories):
    """Compute next state and reward."""
    new_state = max(0, remaining - item_calories)
    # Snap to nearest 100 to stay in discrete state space
    new_state = int(round(new_state / 100) * 100)
    new_state = min(max(new_state, 0), DAILY_CALORIE_TARGET)
    r = reward(remaining, item_calories)
    return new_state, r


def value_iteration():
    """Compute optimal policy using value iteration."""
    V = {s: 0 for s in STATES}
    policy = {}

    for _ in range(100):
        for s in STATES:
            action_values = {}
            for a, cal in MENU.items():
                s_next, r = transition(s, cal)
                action_values[a] = r + GAMMA * V[s_next]
            best_action = max(action_values, key=action_values.get)
            V[s] = action_values[best_action]
            policy[s] = best_action

    return V, policy


# --- Simulation over multiple meals ---

def simulate_day(policy):
    """Simulate a full day (breakfast, lunch, dinner) following a given policy."""
    remaining = DAILY_CALORIE_TARGET
    total_reward = 0
    day_log = []

    for meal in MEALS:
        state_bucket = int(round(remaining / 100) * 100)
        action = policy.get(state_bucket, random.choice(list(MENU.keys())))
        calories = MENU[action]
        next_state, r = transition(remaining, calories)
        day_log.append((meal, action, calories, remaining, r))
        total_reward += r
        remaining = next_state

    return total_reward, day_log


if __name__ == "__main__":
    print("Running value iteration...")
    V, policy = value_iteration()

    print("\n--- Optimal Policy (sample) ---")
    for s in [2000, 1500, 1000, 500, 0]:
        print(f"Remaining {s} → {policy[s]}")

    print("\n--- Simulating 3 days ---")
    for day in range(1, 4):
        total_reward, log = simulate_day(policy)
        print(f"\nDay {day}: Total reward = {total_reward:.2f}")
        for meal, action, cal, rem, r in log:
            print(f"  {meal.title()}: {action} ({cal} cal) | Remaining: {rem} | Reward: {r:.2f}")