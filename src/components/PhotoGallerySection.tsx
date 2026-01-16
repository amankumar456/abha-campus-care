import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Camera, Building2, Stethoscope, Users, GraduationCap } from "lucide-react";
import nitwBackground from "@/assets/nitw-background.png";
import heroHealthCenter from "@/assets/hero-health-center.jpg";

const galleryItems = [
  {
    id: 1,
    image: nitwBackground,
    title: "NIT Warangal Main Campus",
    description: "The iconic entrance and main building of NIT Warangal",
    category: "Campus",
    icon: Building2,
  },
  {
    id: 2,
    image: heroHealthCenter,
    title: "Health Centre",
    description: "State-of-the-art medical facility for students and staff",
    category: "Healthcare",
    icon: Stethoscope,
  },
  {
    id: 3,
    image: nitwBackground,
    title: "Academic Block",
    description: "Modern classrooms and lecture halls equipped with latest technology",
    category: "Academic",
    icon: GraduationCap,
  },
  {
    id: 4,
    image: heroHealthCenter,
    title: "Student Wellness Center",
    description: "Dedicated space for mental health and counseling services",
    category: "Healthcare",
    icon: Users,
  },
  {
    id: 5,
    image: nitwBackground,
    title: "Sports Complex",
    description: "World-class sports facilities for holistic development",
    category: "Sports",
    icon: Building2,
  },
  {
    id: 6,
    image: heroHealthCenter,
    title: "Emergency Services",
    description: "24/7 emergency medical care and ambulance services",
    category: "Healthcare",
    icon: Stethoscope,
  },
];

const categories = ["All", "Campus", "Healthcare", "Academic", "Sports"];

const PhotoGallerySection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<typeof galleryItems[0] | null>(null);

  const filteredItems = selectedCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Camera className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Photo Gallery</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Our Campus & Facilities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Take a visual tour of NIT Warangal's beautiful campus, state-of-the-art health centre, 
            and world-class facilities that make us the pride of India.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-background/80 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {filteredItems.map((item) => (
                <CarouselItem key={item.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card 
                    className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 bg-background/90 backdrop-blur-sm border-border"
                    onClick={() => setSelectedImage(item)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge 
                        className="absolute top-3 left-3 bg-primary/90 text-primary-foreground"
                      >
                        <item.icon className="h-3 w-3 mr-1" />
                        {item.category}
                      </Badge>
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white text-sm line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-background/90 border-border hover:bg-primary hover:text-primary-foreground" />
            <CarouselNext className="right-0 bg-background/90 border-border hover:bg-primary hover:text-primary-foreground" />
          </Carousel>
        </div>

        {/* Grid View for larger screens */}
        <div className="hidden lg:grid grid-cols-4 gap-4 mt-8">
          {filteredItems.slice(0, 4).map((item, index) => (
            <div
              key={`grid-${item.id}`}
              className={`relative overflow-hidden rounded-xl cursor-pointer group ${
                index === 0 ? "col-span-2 row-span-2" : ""
              }`}
              onClick={() => setSelectedImage(item)}
            >
              <img
                src={item.image}
                alt={item.title}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                  index === 0 ? "h-80" : "h-36"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-0">
                  {item.category}
                </Badge>
                <h4 className={`text-white font-semibold ${index === 0 ? "text-xl" : "text-sm"}`}>
                  {item.title}
                </h4>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative max-w-4xl w-full bg-background rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[70vh] object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <selectedImage.icon className="h-3 w-3 mr-1" />
                    {selectedImage.category}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{selectedImage.title}</h3>
                <p className="text-muted-foreground">{selectedImage.description}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PhotoGallerySection;
