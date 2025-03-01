import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

type Product = {
    productId: string;
    name: string;
    price: number;
    images: string[];
};

interface ProductCardProps {
    product: Product;
    onClick: (productId: string) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('sr-RS', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);

    return (
        <Card
            sx={{
                width: 300,                  // Fixed card width
                height: 380,                 // Fixed card height to keep size consistent
                margin: 'auto',
                borderRadius: 2,
                boxShadow: 2,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                },
            }}
        >
            <CardActionArea
                sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
                onClick={() => onClick(product.productId)}
            >
                <CardMedia
                    component="img"
                    image={product.images[0] || 'fallback-image.jpg'}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        e.currentTarget.src = 'fallback-image.jpg';
                    }}
                    sx={{
                        width: '100%',
                        height: 200,             // Fixed image height for uniformity
                        objectFit: 'contain',    // Contain the image without distortion
                        backgroundColor: '#f5f5f5',
                    }}
                />
                <CardContent
                    sx={{
                        textAlign: 'center',
                        flexGrow: 1,            // Fill remaining space in the card
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        gutterBottom
                        variant="h6"
                        component="div"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {product.name}
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                        {formatPrice(product.price)} din
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
