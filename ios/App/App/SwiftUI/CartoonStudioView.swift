import SwiftUI
import PhotosUI

/**
 * CartoonStudioView.swift
 * Native SwiftUI Application for Cartoonify AI.
 *
 * Faithfully reproduces the screens from:
 * 1. App Store: "Cartoonify AI: My Cartoon Look" (Split Slider, 100+ Styles, Riviera Rush)
 * 2. Google Play: "Cartoonify AI Caricature Maker" (Action Figure, 4-Grid Avatars, PFP Maker)
 */

public struct CartoonStudioView: View {

    @State private var selectedImage: UIImage? = UIImage(named: "SamplePortrait")
    @State private var processedImage: UIImage?
    @State private var isProcessing = false
    @State private var activeTab: AppTab = .studio
    @State private var selectedStyle: String = "anime"
    @State private var splitOffset: CGFloat = 0.5

    // Tuning parameters
    @State private var warpFactor: Float = 0.35
    @State private var chinTaper: Float = 0.25
    @State private var eyeMagnify: Float = 0.25
    @State private var enableFaceAlign: Bool = true
    @State private var showTuningSheet = false

    // 4-Grid Avatar state
    @State private var avatarGridImages: [String: UIImage] = [:]
    @State private var isGeneratingGrid = false

    // Photo picker
    @State private var pickerItem: PhotosPickerItem?
    @State private var showingShareSheet = false

    public init() {}

    public enum AppTab: String, CaseIterable {
        case studio = "Studio"
        case avatarGrid = "4-Avatars"
        case pfpMaker = "PFP Maker"
        case explore = "Styles"
    }

    public var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "0a0c14").ignoresSafeArea()

                VStack(spacing: 0) {
                    // Top App Bar
                    headerView

                    // Mode Segment Switcher
                    tabSelector

                    // Content based on tab
                    ScrollView {
                        VStack(spacing: 16) {
                            switch activeTab {
                            case .studio:
                                studioContentView
                            case .avatarGrid:
                                avatarGridContentView
                            case .pfpMaker:
                                pfpMakerContentView
                            case .explore:
                                exploreStylesContentView
                            }
                        }
                        .padding(.vertical, 12)
                    }

                    // Bottom Action Bar
                    bottomActionBar
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showTuningSheet) {
                tuningSheetView
            }
            .onChange(of: pickerItem) { newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self),
                       let uiImage = UIImage(data: data) {
                        await MainActor.run {
                            self.selectedImage = uiImage
                            triggerInference()
                        }
                    }
                }
            }
            .onAppear {
                if processedImage == nil, let img = selectedImage {
                    triggerInference()
                }
            }
        }
    }

    // MARK: - Header
    private var headerView: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(hex: "00f2fe"))
                Text("Cartoonify")
                    .font(.system(size: 20, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("AI")
                    .font(.system(size: 11, weight: .heavy))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color(hex: "00f2fe"))
                    .foregroundColor(.black)
                    .cornerRadius(4)
            }

            Spacer()

            PhotosPicker(selection: $pickerItem, matching: .images) {
                HStack(spacing: 4) {
                    Image(systemName: "photo.badge.plus")
                    Text("Choose Photo")
                        .font(.system(size: 13, weight: .bold))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Color.white.opacity(0.12))
                .foregroundColor(.white)
                .cornerRadius(20)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 6)
    }

    // MARK: - Tab Selector
    private var tabSelector: some View {
        HStack(spacing: 6) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                Button(action: {
                    activeTab = tab
                    if tab == .avatarGrid && avatarGridImages.isEmpty {
                        generate4AvatarGrid()
                    }
                }) {
                    Text(tab.rawValue)
                        .font(.system(size: 13, weight: .bold))
                        .padding(.vertical, 7)
                        .padding(.horizontal, 12)
                        .background(activeTab == tab ? Color(hex: "00f2fe") : Color.white.opacity(0.06))
                        .foregroundColor(activeTab == tab ? .black : .white.opacity(0.8))
                        .cornerRadius(20)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
    }

    // MARK: - Studio View (Split Slider)
    private var studioContentView: some View {
        VStack(spacing: 14) {
            // Main Canvas with Split Slider
            ZStack {
                if let orig = selectedImage, let styled = processedImage {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            // Styled image on background
                            Image(uiImage: styled)
                                .resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: geo.size.height)
                                .clipped()

                            // Original image clipped by split offset
                            Image(uiImage: orig)
                                .resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: geo.size.height)
                                .clipped()
                                .mask(
                                    Rectangle()
                                        .frame(width: geo.size.width * splitOffset)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                )

                            // Split Divider Line
                            Rectangle()
                                .fill(Color.white)
                                .frame(width: 3)
                                .offset(x: geo.size.width * splitOffset - 1.5)
                                .overlay(
                                    Circle()
                                        .fill(Color(hex: "00f2fe"))
                                        .frame(width: 32, height: 32)
                                        .overlay(
                                            Image(systemName: "arrow.left.and.right")
                                                .font(.system(size: 13, weight: .bold))
                                                .foregroundColor(.black)
                                        )
                                        .offset(x: geo.size.width * splitOffset - 1.5)
                                )
                                .gesture(
                                    DragGesture()
                                        .onChanged { value in
                                            let newOffset = value.location.x / geo.size.width
                                            splitOffset = max(0.05, min(0.95, newOffset))
                                        }
                                )
                        }
                    }
                    .frame(height: 380)
                    .cornerRadius(18)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(Color.white.opacity(0.15), lineWidth: 1)
                    )
                } else if isProcessing {
                    RoundedRectangle(cornerRadius: 18)
                        .fill(Color.white.opacity(0.05))
                        .frame(height: 380)
                        .overlay(
                            VStack(spacing: 12) {
                                ProgressView()
                                    .scaleEffect(1.3)
                                    .tint(Color(hex: "00f2fe"))
                                Text("Running Apple Neural Engine Core ML...")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.8))
                            }
                        )
                }
            }
            .padding(.horizontal, 16)

            // Style Quick Carousel
            styleSelectorCarousel

            // Caricature & Tuning Button
            Button(action: { showTuningSheet = true }) {
                HStack {
                    Image(systemName: "slider.horizontal.3")
                        .foregroundColor(Color(hex: "00f2fe"))
                    Text("Caricature Warping (Đầu to/thân nhỏ) & Vision Tuning")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white.opacity(0.4))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.06))
                .cornerRadius(14)
            }
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Meet your AVATAR versions (4-Grid)
    private var avatarGridContentView: some View {
        VStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Meet your AVATAR versions")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(.white)
                Text("1 Photo transformed into 4 iconic cartoon art styles simultaneously")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.6))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 16)

            if isGeneratingGrid {
                VStack(spacing: 12) {
                    ProgressView().tint(Color(hex: "00f2fe"))
                    Text("Processing 4 Styles on Apple Neural Engine...")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
                .frame(height: 320)
            } else {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                    avatarGridCard(title: "Anime Look", styleKey: "anime", gradient: [Color.pink, Color.orange])
                    avatarGridCard(title: "3D Pixar Avatar", styleKey: "pixar3d", gradient: [Color.blue, Color.cyan])
                    avatarGridCard(title: "Caricature Artist", styleKey: "caricature", gradient: [Color.orange, Color.red])
                    avatarGridCard(title: "Retro Comic", styleKey: "comic_book", gradient: [Color.purple, Color.indigo])
                }
                .padding(.horizontal, 16)
            }
        }
    }

    private func avatarGridCard(title: String, styleKey: String, gradient: [Color]) -> some View {
        VStack(spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                if let img = avatarGridImages[styleKey] {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 160)
                        .clipped()
                } else if let orig = selectedImage {
                    Image(uiImage: orig)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 160)
                        .clipped()
                }

                LinearGradient(colors: [Color.clear, Color.black.opacity(0.8)], startPoint: .top, endPoint: .bottom)
                    .frame(height: 50)

                Text(title)
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundColor(.white)
                    .padding(8)
            }
        }
        .background(Color.white.opacity(0.08))
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1.5)
        )
    }

    // MARK: - Profile Picture Maker (PFP)
    private var pfpMakerContentView: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Profile Picture Maker")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(.white)
                Text("Circular high-res cartoon avatar with glowing halo rings for Instagram/TikTok")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.6))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 16)

            ZStack {
                Circle()
                    .fill(RadialGradient(colors: [Color(hex: "00f2fe").opacity(0.4), Color.clear], center: .center, startRadius: 100, endRadius: 160))
                    .frame(width: 310, height: 310)

                Circle()
                    .stroke(
                        AngularGradient(
                            colors: [Color(hex: "00f2fe"), Color(hex: "4facfe"), Color.purple, Color.pink, Color(hex: "00f2fe")],
                            center: .center
                        ),
                        lineWidth: 6
                    )
                    .frame(width: 250, height: 250)

                if let img = processedImage ?? selectedImage {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 240, height: 240)
                        .clipShape(Circle())
                }
            }
            .frame(height: 320)
        }
    }

    // MARK: - Explore Styles
    private var exploreStylesContentView: some View {
        VStack(spacing: 12) {
            Text("100+ Styles Catalog")
                .font(.system(size: 18, weight: .heavy))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)

            // Game Poster (Riviera Rush) Highlight
            VStack(alignment: .leading, spacing: 8) {
                ZStack(alignment: .bottomLeading) {
                    if let img = selectedImage {
                        Image(uiImage: img)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 180)
                            .clipped()
                            .overlay(Color.purple.opacity(0.25))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("GAME POSTER STYLE")
                            .font(.system(size: 10, weight: .black))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.yellow)
                            .foregroundColor(.black)
                            .cornerRadius(4)
                        Text("Riviera Rush GTA Edition")
                            .font(.system(size: 18, weight: .black))
                            .foregroundColor(.white)
                    }
                    .padding(12)
                }
                .cornerRadius(14)
            }
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Bottom Actions
    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            Button(action: {
                showingShareSheet = true
            }) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                    Text("Share")
                }
                .font(.system(size: 14, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.white.opacity(0.12))
                .foregroundColor(.white)
                .cornerRadius(16)
            }

            Button(action: saveToPhotoLibrary) {
                HStack {
                    Image(systemName: "arrow.down.to.line")
                    Text("Save to Photos")
                }
                .font(.system(size: 14, weight: .heavy))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color(hex: "00f2fe"))
                .foregroundColor(.black)
                .cornerRadius(16)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(Color(hex: "0d101a"))
    }

    // MARK: - Style Selector Carousel
    private var styleSelectorCarousel: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                styleCard(title: "Anime", id: "anime", icon: "sparkles")
                styleCard(title: "Caricature", id: "caricature", icon: "face.smiling")
                styleCard(title: "3D Pixar", id: "pixar3d", icon: "person.crop.circle")
                styleCard(title: "Game Poster", id: "game_poster", icon: "gamecontroller")
                styleCard(title: "Action Figure", id: "action_figure", icon: "shippingbox")
            }
            .padding(.horizontal, 16)
        }
    }

    private func styleCard(title: String, id: String, icon: String) -> some View {
        Button(action: {
            selectedStyle = id
            triggerInference()
        }) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .frame(width: 46, height: 46)
                    .background(selectedStyle == id ? Color(hex: "00f2fe") : Color.white.opacity(0.1))
                    .foregroundColor(selectedStyle == id ? .black : .white)
                    .cornerRadius(12)

                Text(title)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(selectedStyle == id ? Color(hex: "00f2fe") : .white.opacity(0.7))
            }
        }
    }

    // MARK: - Tuning Sheet
    private var tuningSheetView: some View {
        NavigationView {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Caricature Warping Factor (Đầu to)")
                        .font(.system(size: 13, weight: .bold))
                    Slider(value: $warpFactor, in: 0...1.0)
                        .tint(Color(hex: "00f2fe"))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Chin Taper (Thu gọn cằm)")
                        .font(.system(size: 13, weight: .bold))
                    Slider(value: $chinTaper, in: 0...0.8)
                        .tint(Color(hex: "00f2fe"))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Eye Magnification (Phóng to mắt)")
                        .font(.system(size: 13, weight: .bold))
                    Slider(value: $eyeMagnify, in: 0...0.6)
                        .tint(Color(hex: "00f2fe"))
                }

                Toggle("Vision Eye-Axis Face Alignment", isOn: $enableFaceAlign)
                    .font(.system(size: 13, weight: .bold))

                Spacer()

                Button("Apply & Run Inference") {
                    showTuningSheet = false
                    triggerInference()
                }
                .font(.system(size: 15, weight: .heavy))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color(hex: "00f2fe"))
                .foregroundColor(.black)
                .cornerRadius(14)
            }
            .padding(20)
            .navigationTitle("AI & Warping Tuning")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    // MARK: - Logic
    private func triggerInference() {
        guard let img = selectedImage else { return }
        isProcessing = true

        CoreMLCartoonEngine.shared.processCartoonify(
            image: img,
            style: selectedStyle,
            warpFactor: selectedStyle == "caricature" ? max(0.55, warpFactor) : warpFactor,
            chinTaper: chinTaper,
            eyeMagnify: eyeMagnify,
            enableFaceAlign: enableFaceAlign
        ) { result in
            DispatchQueue.main.async {
                self.processedImage = result
                self.isProcessing = false
            }
        }
    }

    private func generate4AvatarGrid() {
        guard let img = selectedImage else { return }
        isGeneratingGrid = true

        let styles = ["anime", "pixar3d", "caricature", "comic_book"]
        let group = DispatchGroup()

        for st in styles {
            group.enter()
            CoreMLCartoonEngine.shared.processCartoonify(
                image: img,
                style: st,
                warpFactor: st == "caricature" ? 0.65 : 0.2,
                chinTaper: 0.25,
                eyeMagnify: 0.25,
                enableFaceAlign: true
            ) { styled in
                DispatchQueue.main.async {
                    self.avatarGridImages[st] = styled
                }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            self.isGeneratingGrid = false
        }
    }

    private func saveToPhotoLibrary() {
        guard let imageToSave = processedImage ?? selectedImage else { return }
        UIImageWriteToSavedPhotosAlbum(imageToSave, nil, nil, nil)
    }
}

// Color hex helper
extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        _ = scanner.scanString("#")
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255.0
        let g = Double((rgb >> 8) & 0xFF) / 255.0
        let b = Double(rgb & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
