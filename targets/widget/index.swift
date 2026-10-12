import SwiftUI
import WidgetKit

// MARK: - Shared snapshot (written by src/lib/homeWidget.ts)

private let appGroup = "group.com.homekeep.mobile"
private let snapshotKey = "homeSnapshot"

struct SnapshotTask: Codable, Hashable {
  let id: String
  let title: String
  /// Local calendar date, yyyy-MM-dd.
  let due: String
}

struct SnapshotHealth: Codable, Hashable {
  let score: Int
  let grade: String
}

struct HomeSnapshot: Codable, Hashable {
  let version: Int
  let signedIn: Bool
  let health: SnapshotHealth?
  let tasks: [SnapshotTask]

  static func load() -> HomeSnapshot? {
    guard
      let json = UserDefaults(suiteName: appGroup)?.string(forKey: snapshotKey),
      let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(HomeSnapshot.self, from: data)
  }

  static let sample = HomeSnapshot(
    version: 1,
    signedIn: true,
    health: SnapshotHealth(score: 82, grade: "good"),
    tasks: [
      SnapshotTask(id: "1", title: "Replace HVAC filter", due: dayString(offset: -2)),
      SnapshotTask(id: "2", title: "Test smoke & CO alarms", due: dayString(offset: 0)),
      SnapshotTask(id: "3", title: "Clean gutters & downspouts", due: dayString(offset: 3)),
    ]
  )
}

private let dayFormatter: DateFormatter = {
  let f = DateFormatter()
  f.calendar = Calendar(identifier: .gregorian)
  f.locale = Locale(identifier: "en_US_POSIX")
  f.dateFormat = "yyyy-MM-dd"
  return f
}()

private func dayString(offset: Int) -> String {
  let day = Calendar.current.date(byAdding: .day, value: offset, to: Date()) ?? Date()
  return dayFormatter.string(from: day)
}

// MARK: - Entry with labels resolved for the entry's day

struct DueTask: Hashable {
  let id: String
  let title: String
  /// Negative when overdue.
  let daysUntil: Int

  var isOverdue: Bool { daysUntil < 0 }

  var dueLabel: String {
    switch daysUntil {
    case ..<(-1): return "\(-daysUntil) days overdue"
    case -1: return "1 day overdue"
    case 0: return "Today"
    case 1: return "Tomorrow"
    default:
      let date = Calendar.current.date(byAdding: .day, value: daysUntil, to: Date()) ?? Date()
      return daysUntil < 7
        ? date.formatted(.dateTime.weekday(.wide))
        : date.formatted(.dateTime.month(.abbreviated).day())
    }
  }

  var url: URL {
    let id = self.id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? self.id
    return URL(string: "homekeep://widget/task/\(id)")!
  }
}

struct HomeEntry: TimelineEntry {
  let date: Date
  let snapshot: HomeSnapshot?

  var signedIn: Bool { snapshot?.signedIn ?? false }
  var health: SnapshotHealth? { snapshot?.health }

  var tasks: [DueTask] {
    let today = Calendar.current.startOfDay(for: date)
    return (snapshot?.tasks ?? []).compactMap { task in
      guard let due = dayFormatter.date(from: task.due) else { return nil }
      let days = Calendar.current.dateComponents([.day], from: today, to: Calendar.current.startOfDay(for: due)).day ?? 0
      return DueTask(id: task.id, title: task.title, daysUntil: days)
    }
  }

  var overdueCount: Int { tasks.filter(\.isOverdue).count }
  var dueThisWeek: Int { tasks.filter { !$0.isOverdue && $0.daysUntil < 7 }.count }
  var next: DueTask? { tasks.first }
}

// MARK: - Timeline

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> HomeEntry {
    HomeEntry(date: Date(), snapshot: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (HomeEntry) -> Void) {
    let stored = HomeSnapshot.load()
    let useSample = context.isPreview && (stored == nil || stored?.signedIn == false)
    completion(HomeEntry(date: Date(), snapshot: useSample ? .sample : stored))
  }

  /// The app reloads timelines when data changes; midnight entries keep "Today"/"overdue" labels current in between.
  func getTimeline(in context: Context, completion: @escaping (Timeline<HomeEntry>) -> Void) {
    let snapshot = HomeSnapshot.load()
    let now = Date()
    let today = Calendar.current.startOfDay(for: now)
    var entries = [HomeEntry(date: now, snapshot: snapshot)]
    for offset in 1...3 {
      if let midnight = Calendar.current.date(byAdding: .day, value: offset, to: today) {
        entries.append(HomeEntry(date: midnight, snapshot: snapshot))
      }
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

// MARK: - Shared pieces

private func gradeColor(_ grade: String?) -> Color {
  switch grade {
  case "good": return Color("hkSage")
  case "fair": return Color("hkWarning")
  case "needs_attention": return Color("hkOverdue")
  default: return Color("hkMuted")
  }
}

private func gradeLabel(_ grade: String) -> String {
  switch grade {
  case "good": return "Looking good"
  case "fair": return "A few things slipping"
  default: return "Needs attention"
  }
}

struct HealthRing: View {
  let health: SnapshotHealth
  var size: CGFloat = 52
  var lineWidth: CGFloat = 5

  var body: some View {
    ZStack {
      Circle().stroke(Color("hkTrack"), lineWidth: lineWidth)
      Circle()
        .trim(from: 0, to: CGFloat(max(0, min(100, health.score))) / 100)
        .stroke(gradeColor(health.grade), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Text("\(health.score)")
        .font(.system(size: size * 0.36, weight: .bold, design: .serif))
        .foregroundStyle(Color("hkInk"))
        .monospacedDigit()
    }
    .frame(width: size, height: size)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("Home health \(health.score) out of 100")
  }
}

struct Wordmark: View {
  var body: some View {
    (Text("Home").foregroundStyle(Color("hkInk")) + Text("Keep").foregroundStyle(Color("hkCopper")))
      .font(.system(size: 12, weight: .heavy))
  }
}

struct MessageView: View {
  let title: String
  let detail: String

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Wordmark()
      Spacer(minLength: 0)
      Text(title)
        .font(.system(.headline, design: .serif))
        .foregroundStyle(Color("hkInk"))
      Text(detail)
        .font(.caption)
        .foregroundStyle(Color("hkMuted"))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

// MARK: - Home Screen

struct SmallView: View {
  let entry: HomeEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(alignment: .top) {
        Wordmark()
        Spacer(minLength: 0)
        if let health = entry.health {
          HealthRing(health: health, size: 40, lineWidth: 4)
        }
      }
      Spacer(minLength: 0)
      statusLine
      if let next = entry.next {
        Text(next.title)
          .font(.system(.subheadline, design: .serif).weight(.semibold))
          .foregroundStyle(Color("hkInk"))
          .lineLimit(2)
        Text(next.dueLabel)
          .font(.caption2.weight(.semibold))
          .foregroundStyle(next.isOverdue ? Color("hkOverdue") : Color("hkMuted"))
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .widgetURL(entry.next?.url ?? URL(string: "homekeep://widget")!)
  }

  @ViewBuilder private var statusLine: some View {
    if entry.overdueCount > 0 {
      Text("\(entry.overdueCount) overdue")
        .font(.caption.weight(.bold))
        .foregroundStyle(Color("hkOverdue"))
    } else if entry.next == nil {
      Text("All caught up")
        .font(.caption.weight(.bold))
        .foregroundStyle(Color("hkSage"))
    } else {
      Text("Up next")
        .font(.caption.weight(.bold))
        .foregroundStyle(Color("hkMuted"))
    }
  }
}

struct MediumView: View {
  let entry: HomeEntry

  var body: some View {
    HStack(alignment: .top, spacing: 14) {
      VStack(alignment: .leading, spacing: 6) {
        Wordmark()
        Spacer(minLength: 0)
        if let health = entry.health {
          HealthRing(health: health, size: 56, lineWidth: 5)
          Text(gradeLabel(health.grade))
            .font(.caption2)
            .foregroundStyle(Color("hkMuted"))
            .lineLimit(2)
        }
        if entry.overdueCount > 0 {
          Text("\(entry.overdueCount) overdue")
            .font(.caption.weight(.bold))
            .foregroundStyle(Color("hkOverdue"))
        } else if entry.dueThisWeek > 0 {
          Text("\(entry.dueThisWeek) this week")
            .font(.caption.weight(.semibold))
            .foregroundStyle(Color("hkMuted"))
        }
      }
      .frame(width: 92, alignment: .leading)

      VStack(alignment: .leading, spacing: 8) {
        if entry.tasks.isEmpty {
          Spacer(minLength: 0)
          Text("Nothing on the schedule")
            .font(.system(.subheadline, design: .serif).weight(.semibold))
            .foregroundStyle(Color("hkInk"))
          Text("Enjoy the quiet.")
            .font(.caption)
            .foregroundStyle(Color("hkMuted"))
          Spacer(minLength: 0)
        } else {
          ForEach(entry.tasks.prefix(3), id: \.self) { task in
            Link(destination: task.url) {
              HStack(alignment: .firstTextBaseline, spacing: 8) {
                Circle()
                  .fill(task.isOverdue ? Color("hkOverdue") : (task.daysUntil == 0 ? Color("hkCopper") : Color("hkTrack")))
                  .frame(width: 7, height: 7)
                VStack(alignment: .leading, spacing: 1) {
                  Text(task.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color("hkInk"))
                    .lineLimit(1)
                  Text(task.dueLabel)
                    .font(.caption2)
                    .foregroundStyle(task.isOverdue ? Color("hkOverdue") : Color("hkMuted"))
                }
              }
            }
          }
          Spacer(minLength: 0)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(URL(string: "homekeep://widget")!)
  }
}

// MARK: - Lock Screen

struct CircularView: View {
  let entry: HomeEntry

  var body: some View {
    if let health = entry.health {
      Gauge(value: Double(health.score), in: 0...100) {
        Image(systemName: "house.fill")
      } currentValueLabel: {
        Text("\(health.score)").monospacedDigit()
      }
      .gaugeStyle(.accessoryCircular)
      .widgetAccentable()
      .accessibilityLabel("Home health \(health.score)")
    } else {
      ZStack {
        AccessoryWidgetBackground()
        VStack(spacing: 0) {
          Text("\(entry.overdueCount)")
            .font(.system(.title2, design: .rounded).weight(.bold))
            .widgetAccentable()
          Text("overdue").font(.system(size: 9))
        }
      }
    }
  }
}

struct RectangularView: View {
  let entry: HomeEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      HStack(spacing: 4) {
        Image(systemName: "house.fill")
        Text(entry.overdueCount > 0 ? "\(entry.overdueCount) overdue" : "Up next")
      }
      .font(.caption2.weight(.semibold))
      .widgetAccentable()
      if let next = entry.next {
        Text(next.title).font(.headline).lineLimit(1)
        Text(next.dueLabel).font(.caption2)
      } else {
        Text("All caught up").font(.headline)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .widgetURL(entry.next?.url ?? URL(string: "homekeep://widget")!)
  }
}

struct InlineView: View {
  let entry: HomeEntry

  var body: some View {
    if let next = entry.next {
      Label(
        entry.overdueCount > 0
          ? "\(entry.overdueCount) overdue · \(next.title)"
          : "\(next.dueLabel): \(next.title)",
        systemImage: "house.fill"
      )
    } else {
      Label("Home all caught up", systemImage: "house.fill")
    }
  }
}

// MARK: - Widget

struct HomeKeepWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: HomeEntry

  var body: some View {
    content.containerBackground(for: .widget) {
      if isAccessory { Color.clear } else { Color("hkBackground") }
    }
  }

  private var isAccessory: Bool {
    family == .accessoryCircular || family == .accessoryRectangular || family == .accessoryInline
  }

  @ViewBuilder private var content: some View {
    if !entry.signedIn {
      if isAccessory {
        Label("Open HomeKeep", systemImage: "house.fill")
      } else {
        MessageView(title: "Open HomeKeep", detail: "Sign in to see what's next.")
          .widgetURL(URL(string: "homekeep://widget")!)
      }
    } else {
      switch family {
      case .systemMedium: MediumView(entry: entry)
      case .accessoryCircular: CircularView(entry: entry)
      case .accessoryRectangular: RectangularView(entry: entry)
      case .accessoryInline: InlineView(entry: entry)
      default: SmallView(entry: entry)
      }
    }
  }
}

struct HomeKeepWidget: Widget {
  let kind = "HomeKeepWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      HomeKeepWidgetView(entry: entry)
    }
    .configurationDisplayName("Up next")
    .description("Your home health and the next jobs on the schedule.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryCircular,
      .accessoryRectangular,
      .accessoryInline,
    ])
  }
}

@main
struct HomeKeepWidgets: WidgetBundle {
  var body: some Widget {
    HomeKeepWidget()
  }
}

#Preview(as: .systemSmall) {
  HomeKeepWidget()
} timeline: {
  HomeEntry(date: .now, snapshot: .sample)
}

#Preview(as: .systemMedium) {
  HomeKeepWidget()
} timeline: {
  HomeEntry(date: .now, snapshot: .sample)
}
