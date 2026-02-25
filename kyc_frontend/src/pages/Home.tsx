import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, CheckCircle, Users, Zap, Award, ArrowRight, Star, TrendingUp, Database, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, useInView } from 'framer-motion';
import { ConnectWallet, useAddress } from '@thirdweb-dev/react';
import { CredentialVerification } from '@/components/CredentialVerification';
import { useRef } from 'react';
import { ContractVerifier } from '@/components/ContractVerifier';

const features = [
  {
    icon: Lock,
    title: 'Zero-Knowledge Proofs',
    description: 'Verify your identity without revealing sensitive personal data using advanced cryptographic proofs',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Database,
    title: 'Decentralized Storage',
    description: 'Your encrypted data is stored securely on IPFS with complete ownership control',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Shield,
    title: 'Blockchain Verified',
    description: 'Immutable verification records stored permanently on Ethereum blockchain',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: Award,
    title: 'Soulbound NFTs',
    description: 'Earn unique, non-transferable NFT badges representing your verified credentials',
    color: 'from-orange-500 to-red-600',
  },
];

const stats = [
  { icon: Users, label: 'Active Users', value: '10,000+', color: 'text-blue-600' },
  { icon: CheckCircle, label: 'Verifications', value: '25,000+', color: 'text-green-600' },
  { icon: Shield, label: 'Security Score', value: '99.9%', color: 'text-purple-600' },
  { icon: TrendingUp, label: 'Success Rate', value: '98.5%', color: 'text-orange-600' },
];

const benefits = [
  { icon: Eye, title: 'Privacy First', description: 'Your sensitive data never leaves your device' },
  { icon: Zap, title: 'Lightning Fast', description: 'Complete verification in under 5 minutes' },
  { icon: Globe, title: 'Global Access', description: 'Accepted worldwide by partner organizations' },
  { icon: Star, title: 'Premium Quality', description: 'Bank-grade security and compliance standards' },
];

const Home = () => {
  const navigate = useNavigate();
  const address = useAddress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl" />
          <div className="relative z-10">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm">
              🚀 Next-Gen Identity Verification
            </Badge>
            <motion.h1 
              className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Welcome to REGKYC
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              The future of identity verification is here. Secure, private, and decentralized 
              <span className="text-primary font-semibold"> blockchain-powered KYC</span> that puts you in control.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {!address ? (
                <div className="flex flex-col items-center gap-6">
                  <p className="text-lg text-muted-foreground">Connect your wallet to unlock the future of identity</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <ConnectWallet
                      theme="dark"
                      btnTitle="🔗 Connect Wallet"
                      modalTitle="Select Your Wallet"
                      className="px-8 py-3 text-lg"
                    />
                    <Button
                      onClick={() => navigate('/kyc')}
                      size="lg"
                      variant="outline"
                      className="px-8 py-3"
                    >
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-green-700 dark:text-green-400 font-medium">
                      Connected: {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => navigate('/profile')}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-purple-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 px-8 py-3"
                    >
                      🎯 View Profile
                    </Button>
                    <Button
                      onClick={() => navigate('/kyc')}
                      size="lg"
                      variant="outline"
                      className="px-8 py-3 hover:bg-primary/10"
                    >
                      ✨ Start KYC Journey
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                className="text-center"
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                  <CardContent className="p-0">
                    <Icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                    <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Features Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose REGKYC?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of identity verification with cutting-edge technology
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 + index * 0.15 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group"
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                    <CardContent className="p-8 text-center relative z-10">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for the Future</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience unparalleled security and privacy with our innovative approach
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                  className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors duration-300"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="relative mb-20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 rounded-2xl" />
          <Card className="relative z-10 border-2 border-primary/10">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                🚀 Simple 4-Step Process
              </CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Get verified in minutes with our streamlined blockchain-powered process
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: 'Connect Wallet', icon: '🔗', desc: 'Link your Web3 wallet securely' },
                  { step: 'Upload Documents', icon: '📋', desc: 'Provide your KYC documents' },
                  { step: 'Generate ZK Proof', icon: '🔐', desc: 'Create privacy-preserving proof' },
                  { step: 'Mint NFT Badge', icon: '🏆', desc: 'Receive your verification NFT' }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.9 + index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg">
                          {item.icon}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-2">{item.step}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
                <ContractVerifier />
        {/* Credential Verification Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.0 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">🔍 Verify Credentials</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Instantly verify any credential hash on the blockchain or check your own verification status
            </p>
          </div>
          <CredentialVerification />
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
