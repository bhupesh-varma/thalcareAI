import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("evaluation.csv")

plt.figure()
plt.bar(df["System"], df["Precision@5"])
plt.title("Precision@5 Comparison")
plt.show()

plt.figure()
plt.bar(df["System"], df["Latency"])
plt.title("Query Latency Comparison")
plt.show()
