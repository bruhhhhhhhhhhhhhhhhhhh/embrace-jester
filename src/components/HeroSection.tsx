import heroImage from "@/assets/hero-streetwear.jpg";

const HeroSection = () => {
  return (
    <section className="relative border-b">
      <div className="grid min-h-[70vh] md:grid-cols-2">
        {/* Text side */}
        <div className="flex flex-col justify-center px-6 py-16 md:px-12 lg:px-20">
          <p className="mb-4 font-mono text-sm tracking-widest text-muted-foreground">
            // NEW DROP — LIMITED QUANTITIES
          </p>
          <h1 className="mb-6 font-heading text-4xl font-bold uppercase leading-[0.95] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            DROP 001:
            <br />
            STAT-CHECK
            <br />
            COLLECTION.
          </h1>
          <p className="mb-8 max-w-md text-lg text-muted-foreground">
            Heavyweight cotton. Optimized fit. Mog or be mogged.
          </p>
          <button className="w-fit border border-primary bg-primary px-8 py-4 font-mono text-sm font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/80">
            [ ENTER WAREHOUSE ]
          </button>
        </div>

        {/* Image side */}
        <div className="relative min-h-[300px] border-l">
          <img
            src={heroImage}
            alt="Stat-Check Collection - Heavyweight streetwear on concrete"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-background/20" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
