class GoalTracker:
    def _init_(self):
        self.goals = {} #key = goal name, value = hours logged


def log_hours(self, goal, hours):
    if goal in self.goals:
        self.goals[goal] += hours
    else:
        self.goals[goal] = hours


def total_hours(self):
    return sum(self.goals.values())

def show_goals(self):
    for goal, hours in self.goals.items():
        print(f"{goal}: {hours} hours")